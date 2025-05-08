import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import AudioRecorder from '@/components/ui/audio-recorder';
import AnnouncementCard from '@/components/ui/announcement-card';
import { Announcement, AnnouncementComment, User } from '@shared/schema';

const formSchema = z.object({
  text: z.string().optional(),
}).refine(data => data.text && data.text.trim().length > 0 || data.audioUrl, {
  message: "Veuillez ajouter du texte ou un enregistrement vocal",
  path: ["text"]
});

type FormValues = z.infer<typeof formSchema> & { audioUrl?: string };

export default function AnnouncementsPage() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Fetch all announcements with comments
  const { data: announcements, isLoading: isLoadingAnnouncements } = useQuery<(Announcement & { comments: AnnouncementComment[] })[]>({
    queryKey: ['/api/announcements'],
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      audioUrl: undefined,
    },
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiRequest('POST', '/api/announcements', values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      form.reset();
      setAudioUrl(null);
      toast({
        title: 'Annonce publiée',
        description: 'Votre annonce a été publiée avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error creating announcement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de publier l\'annonce. Veuillez réessayer.',
        variant: 'destructive',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    if (!values.text && !audioUrl) {
      toast({
        title: 'Erreur',
        description: 'Veuillez ajouter du texte ou un enregistrement vocal.',
        variant: 'destructive',
      });
      return;
    }

    createAnnouncementMutation.mutate({
      ...values,
      audioUrl: audioUrl || undefined,
    });
  };

  // Handle audio recording
  const handleAudioReady = (url: string) => {
    setAudioUrl(url);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white bg-opacity-90 rounded-xl shadow-lg">
        <CardContent className="p-6">
          <h2 className="font-heading text-2xl font-bold text-gray-800 mb-4">Annonces et commentaires</h2>
          
          <div className="mb-6">
            <h3 className="font-heading text-xl mb-3 text-primary">Publier une annonce</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Votre annonce</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={3} 
                          placeholder="Partagez une information avec la famille..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="mb-4">
                  <AudioRecorder onAudioReady={handleAudioReady} />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-primary text-white"
                    disabled={createAnnouncementMutation.isPending}
                  >
                    Publier l'annonce
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          
          <div className="space-y-6">
            {isLoadingAnnouncements || isLoadingUser ? (
              <p>Chargement des annonces...</p>
            ) : announcements && announcements.length > 0 && user ? (
              announcements.map((announcement) => (
                <AnnouncementCard 
                  key={announcement.id} 
                  announcement={announcement} 
                  currentUser={user}
                />
              ))
            ) : (
              <div className="text-center p-8 border border-gray-200 rounded-lg">
                <p className="text-gray-500">Aucune annonce pour le moment. Soyez le premier à publier !</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
