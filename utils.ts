import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, formatPattern = "PPP") {
  const dateObj = date instanceof Date ? date : new Date(date);
  return format(dateObj, formatPattern, { locale: fr });
}

export function formatDateTime(date: Date | string, formatPattern = "PPPp") {
  const dateObj = date instanceof Date ? date : new Date(date);
  return format(dateObj, formatPattern, { locale: fr });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(amount);
}

export const DEFAULT_PROFILE_PICTURE = "https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80";

export function getFileType(file: File): 'image' | 'audio' | 'video' | 'unknown' {
  if (file.type.startsWith('image/')) {
    return 'image';
  } else if (file.type.startsWith('audio/')) {
    return 'audio';
  } else if (file.type.startsWith('video/')) {
    return 'video';
  }
  return 'unknown';
}

export async function getAudioDuration(audioFile: File): Promise<string> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(audioFile);
    
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    });
    
    audio.addEventListener('error', () => {
      resolve('0:00');
    });
  });
}

export async function generateThumbnail(videoFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);
    
    video.onloadedmetadata = () => {
      video.currentTime = 1; // Seek to 1 second
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      URL.revokeObjectURL(video.src);
      resolve(dataUrl);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to generate thumbnail'));
    };
  });
}

export function getVideoDuration(videoFile: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const duration = video.duration;
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve('0:00');
    };
  });
}
