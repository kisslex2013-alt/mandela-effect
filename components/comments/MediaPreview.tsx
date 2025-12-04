'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface MediaPreviewProps {
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
}

export function MediaPreview({ imageUrl, videoUrl, audioUrl }: MediaPreviewProps) {
  const [error, setError] = useState(false);
  
  if (imageUrl) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/30">
        {error ? (
          <div className="p-4 text-center text-light/40">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <p className="text-xs">Не удалось загрузить изображение</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Превью"
            className="w-full h-auto max-h-96 object-contain"
            onError={() => setError(true)}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    );
  }
  
  if (videoUrl) {
    // Для YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = extractYouTubeId(videoUrl);
      if (videoId) {
        return (
          <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/30 aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="no-referrer"
            />
          </div>
        );
      }
    }
    
    // Для Vimeo
    if (videoUrl.includes('vimeo.com')) {
      const videoId = extractVimeoId(videoUrl);
      if (videoId) {
        return (
          <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/30 aspect-video">
            <iframe
              src={`https://player.vimeo.com/video/${videoId}`}
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="no-referrer"
            />
          </div>
        );
      }
    }
    
    // Для других видео - просто ссылка
    return (
      <div className="p-3 bg-white/5 rounded border border-white/10">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:underline break-all"
        >
          {videoUrl}
        </a>
      </div>
    );
  }
  
  return null;
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : '';
}

function extractVimeoId(url: string): string {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : '';
}

