import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { PhotoCard } from '@/components/ui/gallery-card';
import FileUpload from '@/components/ui/file-upload';
import { uploadFile } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Photo } from '@shared/schema';
import { Camera } from 'lucide-react';

export default function PhotoGalleryPage() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all photos
  const { data: photos, isLoading } = useQuery<Photo[]>({
    queryKey: ['/api/photos'],
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/photos/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
      toast({
        title: 'Photo supprimée',
        description: 'La photo a été supprimée avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error deleting photo:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la photo. Veuillez réessayer.',
        variant: 'destructive',
      });
    },
  });

  const handlePhotosSelected = async (files: File[]) => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      for (const file of files) {
        await uploadFile(file, '/api/photos', 'photo', {
          title: file.name,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
      
      toast({
        title: 'Photos ajoutées',
        description: `${files.length} photo(s) ont été ajoutées avec succès.`,
      });
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter les photos. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      deletePhotoMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white bg-opacity-90 rounded-xl shadow-lg">
        <CardContent className="p-6">
          <h2 className="font-heading text-2xl font-bold text-gray-800 mb-4">Galerie photos</h2>
          
          <div className="mb-6">
            <FileUpload
              accept="image/*"
              multiple={true}
              maxFiles={10}
              maxSize={5 * 1024 * 1024} // 5MB
              onFilesSelected={handlePhotosSelected}
              buttonText="Ajouter des photos"
              icon={<Camera className="h-5 w-5 mr-2" />}
              variant="outline"
              className="bg-[#FF7F50] text-white px-4 py-2 rounded-lg font-heading font-semibold hover:bg-opacity-90 transition-colors duration-200 shadow-md cursor-pointer inline-block"
            />
          </div>
          
          {isLoading || uploading ? (
            <div className="text-center p-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" role="status">
                <span className="sr-only">Chargement...</span>
              </div>
              <p className="mt-2 text-gray-600">{uploading ? 'Téléchargement en cours...' : 'Chargement des photos...'}</p>
            </div>
          ) : photos && photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="aspect-square">
                  <PhotoCard 
                    photo={photo} 
                    onDelete={handleDeletePhoto}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-gray-200 rounded-lg">
              <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <h4 className="font-heading font-semibold text-lg mb-1">Aucune photo</h4>
              <p className="text-gray-600">Ajoutez vos premières photos pour créer votre galerie familiale.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
