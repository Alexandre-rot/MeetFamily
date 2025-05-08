import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { formatDateTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar, Edit, Trash } from "lucide-react";
import { MeetingAgenda } from "@shared/schema";

const formSchema = z.object({
  title: z.string().min(3, "Le titre doit comporter au moins 3 caractères"),
  date: z.string().min(1, "La date est requise"),
  location: z.string().min(3, "Le lieu doit comporter au moins 3 caractères"),
  description: z.string().min(5, "La description doit comporter au moins 5 caractères"),
});

export default function AgendaPage() {
  const [editingAgendaId, setEditingAgendaId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch meeting agendas
  const { data: agendas, isLoading } = useQuery<MeetingAgenda[]>({
    queryKey: ['/api/meeting-agendas'],
  });

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().slice(0, 16),
      location: "",
      description: "",
    },
  });

  // Create meeting agenda mutation
  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest('POST', '/api/meeting-agendas', values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meeting-agendas'] });
      form.reset();
      toast({
        title: 'Réunion ajoutée',
        description: 'La réunion a été ajoutée avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error creating meeting agenda:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la réunion. Veuillez réessayer.',
        variant: 'destructive',
      });
    },
  });

  // Update meeting agenda mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number, values: z.infer<typeof formSchema> }) => {
      const response = await apiRequest('PUT', `/api/meeting-agendas/${id}`, values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meeting-agendas'] });
      setEditingAgendaId(null);
      form.reset();
      toast({
        title: 'Réunion mise à jour',
        description: 'La réunion a été mise à jour avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error updating meeting agenda:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la réunion. Veuillez réessayer.',
        variant: 'destructive',
      });
    },
  });

  // Delete meeting agenda mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/meeting-agendas/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meeting-agendas'] });
      toast({
        title: 'Réunion supprimée',
        description: 'La réunion a été supprimée avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error deleting meeting agenda:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la réunion. Veuillez réessayer.',
        variant: 'destructive',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingAgendaId) {
      updateMutation.mutate({ id: editingAgendaId, values });
    } else {
      createMutation.mutate(values);
    }
  };

  // Edit meeting agenda
  const handleEdit = (agenda: MeetingAgenda) => {
    setEditingAgendaId(agenda.id);
    form.reset({
      title: agenda.title,
      date: new Date(agenda.date).toISOString().slice(0, 16),
      location: agenda.location,
      description: agenda.description,
    });
  };

  // Delete meeting agenda
  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) {
      deleteMutation.mutate(id);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingAgendaId(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white bg-opacity-90 rounded-xl shadow-lg">
        <CardContent className="p-6">
          <h2 className="font-heading text-2xl font-bold text-gray-800 mb-4">Agenda des réunions</h2>
          
          <div className="mb-6">
            <h3 className="font-heading text-xl mb-3 text-primary">
              {editingAgendaId ? 'Modifier la réunion' : 'Ajouter une nouvelle réunion'}
            </h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre de la réunion</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Réunion mensuelle de Novembre" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date et heure</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lieu</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Maison de Grand-mère" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points à l'ordre du jour</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Détaillez les points à discuter..." 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  {editingAgendaId && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Annuler
                    </Button>
                  )}
                  <Button 
                    type="submit"
                    className="bg-primary text-white"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingAgendaId ? 'Mettre à jour' : 'Enregistrer la réunion'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          
          <div>
            <h3 className="font-heading text-xl mb-3">Réunions à venir</h3>
            
            {isLoading ? (
              <p>Chargement des réunions...</p>
            ) : agendas && agendas.length > 0 ? (
              <div className="space-y-4">
                {agendas.map((agenda) => (
                  <div key={agenda.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-heading font-bold text-lg">{agenda.title}</h4>
                        <p className="text-gray-600">{formatDateTime(agenda.date)}</p>
                        <p className="text-gray-700 mt-1">{agenda.location}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-orange-500 hover:text-opacity-80"
                          onClick={() => handleEdit(agenda)}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-opacity-80"
                          onClick={() => handleDelete(agenda.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-700 text-sm mt-2">
                        <strong>Ordre du jour:</strong> {agenda.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6 bg-white text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <h4 className="font-heading font-semibold text-lg mb-1">Aucune réunion prévue</h4>
                <p className="text-gray-600">Ajoutez votre première réunion en utilisant le formulaire ci-dessus.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
