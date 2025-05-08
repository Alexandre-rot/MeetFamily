import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { VideoCard, VideoPlayer } from '@/components/ui/gallery-card';
import FileUpload from '@/components/ui/file-upload';
import { uploadFile } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Video } from '@shared/schema';
import { generateThumbnail, getVideoDuration } from '@/lib/utils';
import { Film } from 'lucide-react';

export default function VideoGalleryPage() {
  const [uploading, setUploading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all videos
  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ['/api/videos'],
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/videos/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      toast({
        title: 'Vidéo supprimée',
        description: 'La vidéo a été supprimée avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error deleting video:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la vidéo. Veuillez réessayer.',
        variant: 'destructive',
      });
    },
  });

  const handleVideosSelected = async (files: File[]) => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      for (const file of files) {
        // Generate thumbnail and get duration
        let thumbnailUrl = '';
        let duration = '';
        
        try {
          thumbnailUrl = await generateThumbnail(file);
          duration = await getVideoDuration(file);
        } catch (error) {
          console.error('Error generating thumbnail or duration:', error);
        }
        
        await uploadFile(file, '/api/videos', 'video', {
          title: file.name,
          duration: duration,
          thumbnailUrl: thumbnailUrl,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      
      toast({
        title: 'Vidéos ajoutées',
        description: `${files.length} vidéo(s) ont été ajoutées avec succès.`,
      });
    } catch (error) {
      console.error('Error uploading videos:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter les vidéos. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) {
      deleteVideoMutation.mutate(id);
    }
  };

  const handlePlayVideo = (videoUrl: string) => {
    setCurrentVideo(videoUrl);
  };

  const handleCloseVideo = () => {
    setCurrentVideo(null);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white bg-opacity-90 rounded-xl shadow-lg">
        <CardContent className="p-6">
          <h2 className="font-heading text-2xl font-bold text-gray-800 mb-4">Galerie vidéos</h2>
          
          <div className="mb-6">
            <FileUpload
              accept="video/*"
              multiple={true}
              maxFiles={5}
              maxSize={50 * 1024 * 1024} // 50MB
              onFilesSelected={handleVideosSelected}
              buttonText="Ajouter des vidéos"
              icon={<Film className="h-5 w-5 mr-2" />}
              variant="outline"
              className="bg-[#FF7F50] text-white px-4 py-2 rounded-lg font-heading font-semibold hover:bg-opacity-90 transition-colors duration-200 shadow-md cursor-pointer inline-block"
            />
          </div>
          
          {isLoading || uploading ? (
            <div className="text-center p-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" role="status">
                <span className="sr-only">Chargement...</span>
              </div>
              <p className="mt-2 text-gray-600">{uploading ? 'Téléchargement en cours...' : 'Chargement des vidéos...'}</p>
            </div>
          ) : videos && videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  onDelete={handleDeleteVideo}
                  onPlay={handlePlayVideo}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-gray-200 rounded-lg">
              <Film className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <h4 className="font-heading font-semibold text-lg mb-1">Aucune vidéo</h4>
              <p className="text-gray-600">Ajoutez vos premières vidéos pour créer votre galerie familiale.</p>
            </div>
          )}
          
          {currentVideo && (
            <VideoPlayer 
              videoUrl={currentVideo} 
              onClose={handleCloseVideo}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
