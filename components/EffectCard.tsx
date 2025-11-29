'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';

interface EffectCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryEmoji?: string;
  imageUrl?: string | null;
  votesFor: number;
  votesAgainst: number;
  createdAt?: string;
  badge?: string;
  showProgress?: boolean;
  hasVoted?: boolean;
  className?: string;
}

export default function EffectCard({
  id,
  title,
  description,
  category,
  categoryEmoji,
  imageUrl,
  votesFor,
  votesAgainst,
  createdAt,
  badge,
  showProgress = false,
  hasVoted = false,
  className = '',
}: EffectCardProps) {
  // Логирование для отладки (только один раз при монтировании)
  const hasLogged = useRef(false);
  useEffect(() => {
    if (!hasLogged.current && typeof window !== 'undefined') {
      hasLogged.current = true;
      console.log('[EffectCard] Пропсы получены:', {
        id,
        title,
        imageUrl,
        hasImageUrl: !!imageUrl,
        imageUrlType: typeof imageUrl,
        imageUrlValue: imageUrl,
      });
    }
  }, [id, title, imageUrl]);

  const totalVotes = votesFor + votesAgainst;
  const percentA = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 50;

  return (
    <Link href={`/effect/${id}`} className="group">
      <div
        className={`bg-darkCard rounded-xl overflow-hidden border border-light/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/20 flex flex-col ${className}`}
      >
        {/* Верхняя часть - Изображение */}
        {imageUrl ? (
          <div className="relative w-full h-48 min-h-[192px] shrink-0 overflow-hidden rounded-t-xl bg-darkCard border-b border-light/10">
            <ImageWithSkeleton
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        ) : (
          <div className="h-48 min-h-[192px] shrink-0 w-full bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 flex items-center justify-center rounded-t-xl border-b border-light/10">
            <span className="text-6xl opacity-50">{categoryEmoji || '❓'}</span>
          </div>
        )}

        {/* Нижняя часть - Контент */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Категория и бейдж */}
          <div className="flex items-center gap-2 mb-3">
            {categoryEmoji && (
              <span className="text-2xl transition-transform duration-300 group-hover:scale-125 inline-block">
                {categoryEmoji}
              </span>
            )}
            {badge && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                {badge}
              </span>
            )}
            {!categoryEmoji && !badge && (
              <span className="text-sm text-light/60">{category}</span>
            )}
          </div>

          {/* Название */}
          <h3 className="text-lg md:text-xl font-bold text-light mb-2 transition-colors duration-300 group-hover:text-primary line-clamp-2">
            {title}
          </h3>

          {/* Описание */}
          <p className="text-sm text-light/60 mb-4 line-clamp-2 flex-grow">
            {description}
          </p>

          {/* Прогресс-бар (если включен) */}
          {showProgress && totalVotes > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="text-primary font-semibold">{Math.round(percentA)}%</span>
                <span className="text-secondary font-semibold">{Math.round(100 - percentA)}%</span>
              </div>
              <div className="relative h-2 rounded-full bg-dark/50 overflow-hidden">
                <div
                  className="absolute inset-0 rounded-full transition-all duration-300"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 ${percentA}%, #f59e0b ${percentA}%)`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Футер */}
          <div className="flex items-center justify-between text-xs text-light/40 mt-auto">
            <span>{totalVotes.toLocaleString('ru-RU')} голосов</span>
            {createdAt && (
              <span>{new Date(createdAt).toLocaleDateString('ru-RU')}</span>
            )}
            {hasVoted !== undefined && (
              <span className={hasVoted ? 'text-green-400 font-semibold' : 'text-light/40'}>
                {hasVoted ? '✓ Проголосовал' : 'Не проголосовал'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

