import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { uploadMultipleFiles } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import FileUpload from '@/components/ui/file-upload';
import HistoryEvent from '@/components/ui/history-event';
import { FamilyHistory } from '@shared/schema';
import { BookOpen, Image } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(3, "Le titre doit comporter au moins 3 caractères"),
  date: z.string().min(1, "La date est requise"),
  description: z.string().min(5, "La description doit comporter au moins 5 caractères"),
});

type FormValues = z.infer<typeof formSchema>;

export default function FamilyHistoryPage() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch family history events
  const { data: historyEvents, isLoading } = useQuery<FamilyHistory[]>({
    queryKey: ['/api/family-history'],
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      date: "",
      description: "",
    },
  });

  // Upload images mutation
  const uploadImagesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (files.length === 0) return { imageUrls: [] };
      const response = await uploadMultipleFiles(files, '/api/family-history/images', 'images');
      return response;
    },
  });

  // Create history event mutation
  const createHistoryEventMutation = useMutation({
    mutationFn: async (values: FormValues & { imageUrls: string[] }) => {
      const response = await apiRequest('POST', '/api/family-history', values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-history'] });
      form.reset();
      setSelectedImages([]);
      setImageUrls([]);
      toast({
        title: 'Événement ajouté',
        description: 'L\'événement historique a été ajouté avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error creating history event:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'événement. Veuillez réessayer.',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      let urls = imageUrls;
      
      // Upload images if any
      if (selectedImages.length > 0) {
        const result = await uploadImagesMutation.mutateAsync(selectedImages);
        if (result && result.imageUrls) {
          urls = result.imageUrls;
          setImageUrls(urls);
        }
      }
      
      // Create history event
      await createHistoryEventMutation.mutateAsync({
        ...values,
        imageUrls: urls,
      });
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  // Handle image selection
  const handleImagesSelected = (files: File[]) => {
    setSelectedImages(files);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white bg-opacity-90 rounded-xl shadow-lg">
        <CardContent className="p-6">
          <h2 className="font-heading text-2xl font-bold text-gray-800 mb-4">Historique familiale</h2>
          
          <div className="mb-6">
            <h3 className="font-heading text-xl mb-3 text-primary">Ajouter un événement historique</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre de l'événement</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Fondation de notre famille" 
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
                        <FormLabel>Date (approximative)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: 1920, Décembre 1975, etc." 
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={4} 
                          placeholder="Racontez l'histoire de cet événement..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="mb-4">
                  <FormLabel className="block text-gray-700 font-medium mb-2">
                    Images associées (optionnel)
                  </FormLabel>
                  <div className="border-dashed border-2 border-gray-300 rounded-lg p-4">
                    <FileUpload
                      accept="image/*"
                      multiple={true}
                      maxFiles={5}
                      maxSize={5 * 1024 * 1024} // 5MB
                      onFilesSelected={handleImagesSelected}
                      buttonText="Ajouter des images"
                      icon={<Image className="h-5 w-5 mr-2" />}
                      variant="outline"
                      className="w-full flex flex-col items-center justify-center"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-primary text-white"
                    disabled={createHistoryEventMutation.isPending || uploadImagesMutation.isPending}
                  >
                    Ajouter à l'historique
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          
          <div className="relative border-l-2 border-secondary pl-6 ml-3 mt-10">
            {isLoading ? (
              <p>Chargement de l'historique familial...</p>
            ) : historyEvents && historyEvents.length > 0 ? (
              <div className="space-y-8">
                {historyEvents.map((event, index) => (
                  <HistoryEvent key={event.id} event={event} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <h4 className="font-heading font-semibold text-lg mb-1">Aucun événement historique</h4>
                <p className="text-gray-600">Ajoutez votre premier événement pour créer l'histoire de votre famille.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
