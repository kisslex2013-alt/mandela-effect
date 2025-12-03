'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import { useSound } from '@/lib/hooks/useSound';
import { 
  Film, Music, Tag, User, Globe, Gamepad2, Baby, Ghost, Sparkles, Check
} from 'lucide-react';
import { CATEGORY_MAP } from '@/lib/constants';

interface EffectCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string | null;
  votesFor: number;
  votesAgainst: number;
  createdAt?: string;
  badge?: string;
  showProgress?: boolean;
  hasVoted?: boolean;
  className?: string;
  priority?: boolean;
}

export default function EffectCard({
  id,
  title,
  description,
  category,
  imageUrl,
  votesFor,
  votesAgainst,
  createdAt,
  badge,
  showProgress = false,
  hasVoted = false,
  className = '',
  priority = false,
}: EffectCardProps) {
  const { playClick, playHover } = useSound();

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'films': return <Film className="w-6 h-6" />;
      case 'music': return <Music className="w-6 h-6" />;
      case 'brands': return <Tag className="w-6 h-6" />;
      case 'people': return <User className="w-6 h-6" />;
      case 'geography': return <Globe className="w-6 h-6" />;
      case 'popculture': return <Gamepad2 className="w-6 h-6" />;
      case 'childhood': return <Baby className="w-6 h-6" />;
      case 'russian': return <Ghost className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  const totalVotes = votesFor + votesAgainst;
  const percentA = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 50;
  const safeImageUrl = imageUrl ? imageUrl.replace(/'/g, '%27') : null;
  const categoryName = CATEGORY_MAP[category]?.name || category;

  return (
    <Link 
      href={`/effect/${id}`} 
      className="group"
      onClick={playClick}
      onMouseEnter={() => Math.random() > 0.7 && playHover()}
    >
      <div className={`group relative overflow-hidden bg-darkCard rounded-xl border border-light/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/20 flex flex-col h-full ${className}`}>
        
        {/* Верхняя часть - Изображение */}
        {imageUrl && safeImageUrl ? (
          <div className="shine-effect relative z-10 w-full h-48 min-h-[192px] shrink-0 bg-darkCard border-b border-light/10">
            <ImageWithSkeleton
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={priority}
            />
            <div className="glitch-layers absolute inset-0 z-[2]">
              <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
              <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
              <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
            </div>
          </div>
        ) : (
          <div className="relative z-10 h-48 min-h-[192px] shrink-0 w-full bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 flex items-center justify-center rounded-t-xl border-b border-light/10">
            <span className="text-white/50">{getCategoryIcon(category)}</span>
          </div>
        )}

        {/* Нижняя часть - Контент */}
        <div className="relative z-10 p-5 flex flex-col flex-grow">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-primary opacity-80 group-hover:scale-110 transition-transform duration-300">
              {getCategoryIcon(category)}
            </span>
            {badge ? (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">{badge}</span>
            ) : (
              <span className="text-xs text-light/40 font-bold uppercase tracking-wider">
                {categoryName}
              </span>
            )}
          </div>

          <h3 className="text-lg md:text-xl font-bold text-light mb-2 transition-colors duration-300 group-hover:text-primary line-clamp-2">
            {title}
          </h3>

          <p className="text-sm text-light/60 mb-4 line-clamp-2 flex-grow">
            {description}
          </p>

          {/* Блок Статистики (Если проголосовал) */}
          {showProgress && totalVotes > 0 && hasVoted ? (
            <div className="mt-auto pt-2">
              {/* Инфо-строка: Голоса и Статус */}
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-light/50">{totalVotes.toLocaleString('ru-RU')} голосов</span>
                <span className="flex items-center gap-1 text-green-400 font-medium">
                  <Check className="w-3 h-3" /> Проголосовал
                </span>
              </div>

              {/* Прогресс-бар в одну строку */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-primary w-8 text-right">{Math.round(percentA)}%</span>
                <div className="flex-1 h-2 rounded-full bg-dark/50 overflow-hidden flex">
                   <div className="h-full bg-primary" style={{ width: `${percentA}%` }}></div>
                   <div className="h-full bg-secondary" style={{ width: `${100 - percentA}%` }}></div>
                </div>
                <span className="text-sm font-bold text-secondary w-8 text-left">{Math.round(100 - percentA)}%</span>
              </div>
            </div>
          ) : (
            /* Футер для непроголосовавших */
            <div className="flex items-center justify-between text-xs text-light/40 mt-auto pt-2 border-t border-light/5">
                <span>{totalVotes > 0 ? `${totalVotes} голосов` : 'Пока нет голосов'}</span>
                <span className="group-hover:text-light transition-colors">Нажмите, чтобы выбрать</span>
            </div>
          )}

        </div>
      </div>
    </Link>
  );
}
