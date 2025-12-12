'use client';

import { m, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

export default function ImagePreviewModal({ isOpen, imageUrl, onClose }: ImagePreviewModalProps) {
  if (!isOpen || !imageUrl) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <m.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-7xl max-h-[90vh] bg-dark border border-light/20 rounded-2xl overflow-hidden"
          >
            {/* Кнопка закрытия */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/80 hover:bg-black rounded-full text-white transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Изображение */}
            <div className="flex items-center justify-center p-8">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.png'; // Fallback если изображение не загрузилось
                }}
              />
            </div>

            {/* URL внизу */}
            <div className="px-6 py-4 bg-black/50 border-t border-light/10">
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline break-all font-mono"
              >
                {imageUrl}
              </a>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}

