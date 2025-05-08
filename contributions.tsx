import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Edit, Trash, ChevronRight } from "lucide-react";
import { Contribution, ContributionMember } from "@shared/schema";

const contributionSchema = z.object({
  meetingNumber: z.coerce.number().min(1, "Le numéro de réunion doit être au moins 1"),
  meetingDate: z.string().min(1, "La date est requise"),
});

const memberSchema = z.object({
  lastName: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  firstName: z.string().min(2, "Le prénom doit comporter au moins 2 caractères"),
  amount: z.coerce.number().min(0, "Le montant ne peut pas être négatif"),
});

interface ContributionWithMembers extends Contribution {
  members: ContributionMember[];
}

export default function ContributionsPage() {
  const [currentContribution, setCurrentContribution] = useState<number | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all contributions
  const { data: contributions, isLoading: isLoadingContributions } = useQuery<Contribution[]>({
    queryKey: ['/api/contributions'],
  });

  // Fetch current contribution with members if selected
  const { data: currentContributionData, isLoading: isLoadingCurrentContribution } = useQuery<ContributionWithMembers>({
    queryKey: ['/api/contributions', currentContribution],
    enabled: currentContribution !== null,
  });

  // Contribution form setup
  const contributionForm = useForm<z.infer<typeof contributionSchema>>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      meetingNumber: 1,
      meetingDate: new Date().toISOString().slice(0, 10),
    },
  });

  // Member form setup
  const memberForm = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      lastName: "",
      firstName: "",
      amount: 0,
    },
  });

  // Create contribution mutation
  const createContributionMutation = useMutation({
    mutationFn: async (values: z.infer<typeof contributionSchema>) => {
      const response = await apiRequest('POST', '/api/contributions', {
        ...values,
        meetingDate: new Date(values.meetingDate).toISOString(),
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contributions'] });
      setCurrentContribution(data.id);
      contributionForm.reset();
      toast({
        title: 'Rapport créé',
        description: 'Le rapport de cotisation a été créé avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error creating contribution report:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le rapport. Veuillez réessayer.',
        variant: 'destructive',
      });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ contributionId, values }: { contributionId: number, values: z.infer<typeof memberSchema> }) => {
      const response = await apiRequest('POST', `/api/contributions/${contributionId}/members`, values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contributions', currentContribution] });
      memberForm.reset();
      toast({
        title: 'Membre ajouté',
        description: 'Le membre a été ajouté avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error adding member:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le membre. Veuillez réessayer.',
        variant: 'destructive',
      });
    },
  });

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, values }: { memberId: number, values: z.infer<typeof memberSchema> }) => {
      const response = await apiRequest('PUT', `/api/contributions/members/${memberId}`, values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contributions', currentContribution] });
      memberForm.reset();
      setEditingMemberId(null);
      toast({
        title: 'Membre mis à jour',
        description: 'Le membre a été mis à jour avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error updating member:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le membre. Veuillez réessayer.',
        variant: 'destructive',
      });
    },
  });

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const response = await apiRequest('DELETE', `/api/contributions/members/${memberId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contributions', currentContribution] });
      toast({
        title: 'Membre supprimé',
        description: 'Le membre a été supprimé avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error deleting member:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le membre. Veuillez réessayer.',
        variant: 'destructive',
      });
    },
  });

  // Contribution form submission handler
  const onSubmitContribution = (values: z.infer<typeof contributionSchema>) => {
    createContributionMutation.mutate(values);
  };

  // Member form submission handler
  const onSubmitMember = (values: z.infer<typeof memberSchema>) => {
    if (currentContribution === null) {
      toast({
        title: 'Erreur',
        description: 'Veuillez d\'abord créer un rapport de cotisation.',
        variant: 'destructive',
      });
      return;
    }

    if (editingMemberId) {
      updateMemberMutation.mutate({ memberId: editingMemberId, values });
    } else {
      addMemberMutation.mutate({ contributionId: currentContribution, values });
    }
  };

  // Edit member
  const handleEditMember = (member: ContributionMember) => {
    setEditingMemberId(member.id);
    memberForm.reset({
      lastName: member.lastName,
      firstName: member.firstName,
      amount: member.amount,
    });
  };

  // Delete member
  const handleDeleteMember = (memberId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMemberId(null);
    memberForm.reset();
  };

  // View contribution details
  const handleViewContribution = (contributionId: number) => {
    setCurrentContribution(contributionId);
  };

  // Add new contribution (reset state)
  const handleAddNewContribution = () => {
    setCurrentContribution(null);
    contributionForm.reset();
    memberForm.reset();
  };

  // Calculate total amount whenever members change
  useEffect(() => {
    if (currentContributionData?.members) {
      const total = currentContributionData.members.reduce((sum, member) => sum + member.amount, 0);
      setTotalAmount(total);
    } else {
      setTotalAmount(0);
    }
  }, [currentContributionData]);

  return (
    <div className="space-y-6">
      <Card className="bg-white bg-opacity-90 rounded-xl shadow-lg">
        <CardContent className="p-6">
          <h2 className="font-heading text-2xl font-bold text-gray-800 mb-4">Rapport de cotisations</h2>
          
          {!currentContribution ? (
            <div className="mb-6">
              <h3 className="font-heading text-xl mb-3 text-primary">Nouvelle cotisation</h3>
              
              <Form {...contributionForm}>
                <form onSubmit={contributionForm.handleSubmit(onSubmitContribution)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={contributionForm.control}
                      name="meetingNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantième réunion</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              placeholder="Ex: 12" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={contributionForm.control}
                      name="meetingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de la réunion</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit"
                      className="bg-primary text-white"
                      disabled={createContributionMutation.isPending}
                    >
                      Créer le rapport
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          ) : (
            <div className="mb-6">
              {isLoadingCurrentContribution ? (
                <p>Chargement du rapport...</p>
              ) : currentContributionData ? (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-heading text-xl text-primary">
                      Réunion #{currentContributionData.meetingNumber} - {formatDate(currentContributionData.meetingDate)}
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddNewContribution}
                    >
                      Nouveau rapport
                    </Button>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="font-heading font-semibold mb-3">Ajouter un membre cotisant</h4>
                    
                    <Form {...memberForm}>
                      <form onSubmit={memberForm.handleSubmit(onSubmitMember)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={memberForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Nom de famille" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={memberForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prénom</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Prénom" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={memberForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Montant (FCFA)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    placeholder="Ex: 5000" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          {editingMemberId && (
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              Annuler
                            </Button>
                          )}
                          <Button 
                            type="submit"
                            className="bg-[#FF7F50] text-white"
                            disabled={addMemberMutation.isPending || updateMemberMutation.isPending}
                          >
                            {editingMemberId ? 'Mettre à jour' : 'Ajouter le membre'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-heading font-semibold mb-3">Liste des cotisations</h4>
                    
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Prénom</TableHead>
                            <TableHead className="text-right">Montant (FCFA)</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentContributionData.members && currentContributionData.members.length > 0 ? (
                            currentContributionData.members.map((member) => (
                              <TableRow key={member.id}>
                                <TableCell>{member.lastName}</TableCell>
                                <TableCell>{member.firstName}</TableCell>
                                <TableCell className="text-right">{formatCurrency(member.amount)}</TableCell>
                                <TableCell className="text-center">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-red-500 hover:text-opacity-80 mx-1"
                                    onClick={() => handleDeleteMember(member.id)}
                                    disabled={deleteMemberMutation.isPending}
                                  >
                                    <Trash className="h-5 w-5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-orange-500 hover:text-opacity-80 mx-1"
                                    onClick={() => handleEditMember(member)}
                                  >
                                    <Edit className="h-5 w-5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4">
                                Aucun membre ajouté pour l'instant
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={2} className="py-3 px-4 font-bold text-right">
                              Montant Total:
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right font-bold text-[#4CAF50] text-xl">
                              {formatCurrency(totalAmount)} FCFA
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              ) : (
                <p>Impossible de charger le rapport de cotisation.</p>
              )}
            </div>
          )}
          
          <div className="mt-8">
            <h3 className="font-heading text-xl mb-3">Historique des rapports</h3>
            
            {isLoadingContributions ? (
              <p>Chargement des rapports...</p>
            ) : contributions && contributions.length > 0 ? (
              <div className="space-y-4">
                {contributions.map((contribution) => (
                  <div key={contribution.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-heading font-bold text-lg">Réunion #{contribution.meetingNumber}</h4>
                        <p className="text-gray-600">{formatDate(contribution.meetingDate)}</p>
                      </div>
                      <div className="text-[#4CAF50] font-bold text-xl">
                        {formatCurrency(contribution.totalAmount)} FCFA
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button 
                        variant="link"
                        className="text-sm text-secondary hover:underline p-0"
                        onClick={() => handleViewContribution(contribution.id)}
                      >
                        Voir les détails
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6 bg-white text-center">
                <p className="text-gray-600">Aucun rapport de cotisation pour l'instant.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
