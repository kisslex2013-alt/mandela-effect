'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface ImageWithSkeletonProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
}

export default function ImageWithSkeleton({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  objectFit = 'cover',
  priority = false,
}: ImageWithSkeletonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const prevSrcRef = useRef<string | null | undefined>(src);
  const imageKeyRef = useRef(0);

  // Сбрасываем состояния только при РЕАЛЬНОМ изменении src
  useEffect(() => {
    if (src && src !== prevSrcRef.current) {
      prevSrcRef.current = src;
      setIsLoading(true);
      setHasError(false);
      setRetryCount(0);
      imageKeyRef.current = Date.now(); // Уникальный ключ для принудительной пересборки
    } else if (!src) {
      prevSrcRef.current = null;
      setIsLoading(false);
      setHasError(false);
    }
  }, [src]);

  // Всегда возвращаем обертку с relative для правильной работы fill
  const imageSrc = retryCount > 0 && src ? `${src}${src.includes('?') ? '&' : '?'}retry=${retryCount}` : src;

  return (
    <div className={`relative overflow-hidden bg-darkCard w-full h-full ${className}`} style={fill ? {} : { width, height }}>
      {/* Если нет src, показываем плейсхолдер */}
      {!src ? (
        <div className="absolute inset-0 bg-dark/50 border border-light/10 rounded-lg flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-4xl mb-2 opacity-50">🖼️</div>
            <div className="text-xs text-light/40">Нет изображения</div>
          </div>
        </div>
      ) : hasError ? (
        /* Если ошибка загрузки, показываем плейсхолдер */
        <div className="absolute inset-0 bg-dark/50 border border-light/10 rounded-lg flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-4xl mb-2 opacity-50">⚠️</div>
            <div className="text-xs text-light/40">Ошибка загрузки</div>
          </div>
        </div>
      ) : (
        <>
          {/* Скелетон загрузки */}
          {isLoading && (
            <div className="absolute inset-0 animate-pulse bg-white/5 z-20" />
          )}

          {/* 1. Размытый фон (для красоты) */}
          {imageSrc && (
            <Image
              key={`bg-${imageKeyRef.current}-${retryCount}`}
              src={imageSrc}
              alt=""
              width={fill ? undefined : width}
              height={fill ? undefined : height}
              fill={fill}
              sizes={fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined}
              style={fill ? {} : { position: 'absolute', inset: 0 }}
              className="object-cover blur-3xl scale-110 opacity-50 pointer-events-none"
              aria-hidden="true"
              onError={() => {
                // Игнорируем ошибки фона
              }}
              unoptimized={typeof imageSrc === 'string' && imageSrc.startsWith('http')}
            />
          )}

          {/* 2. Основная картинка */}
          <Image
            key={`${imageKeyRef.current}-${retryCount}`}
            src={imageSrc!}
            alt={alt}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            fill={fill}
            sizes={fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined}
            style={fill ? {} : { width: 'auto', height: 'auto' }}
            className={`object-contain relative z-10 drop-shadow-2xl transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'} ${
              objectFit === 'cover' ? 'object-cover' :
              objectFit === 'contain' ? 'object-contain' :
              objectFit === 'fill' ? 'object-fill' :
              objectFit === 'none' ? 'object-none' :
              'object-scale-down'
            }`}
            onLoad={() => {
              setIsLoading(false);
              setHasError(false);
            }}
            onError={() => {
              // Retry до 2 раз с задержкой
              if (retryCount < 2) {
                setTimeout(() => {
                  setRetryCount(prev => prev + 1);
                  setIsLoading(true);
                  setHasError(false);
                }, 1000 * (retryCount + 1)); // Экспоненциальная задержка: 1s, 2s
              } else {
                setIsLoading(false);
                setHasError(true);
              }
            }}
            priority={priority}
            unoptimized={typeof imageSrc === 'string' && imageSrc.startsWith('http')}
          />
        </>
      )}
    </div>
  );
}

