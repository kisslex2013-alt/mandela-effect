'use client';

import { useState } from 'react';
import { Eye, Camera, Brain, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react';
import { SafeMediaLink } from './SafeMediaLink';
import { MediaPreview } from './MediaPreview';
import { toggleCommentLike } from '@/app/actions/comments';
import { getVisitorId } from '@/lib/visitor';
import toast from 'react-hot-toast';

interface CommentCardProps {
  id: string;
  type: 'WITNESS' | 'ARCHAEOLOGIST' | 'THEORIST';
  text: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  theoryType?: string | null;
  likes: number;
  dislikes?: number;
  userLike?: boolean | null; // null = не лайкнул, true = лайк, false = дизлайк
  createdAt: string;
  onLikeChange?: () => void;
}

export default function CommentCard({
  id,
  type,
  text,
  imageUrl,
  videoUrl,
  audioUrl,
  theoryType,
  likes: initialLikes,
  dislikes: initialDislikes = 0,
  userLike: initialUserLike = null,
  createdAt,
  onLikeChange,
}: CommentCardProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userLike, setUserLike] = useState<boolean | null>(initialUserLike);
  const [isToggling, setIsToggling] = useState(false);

  const handleLike = async (isLike: boolean) => {
    if (isToggling) return;
    
    setIsToggling(true);
    const visitorId = getVisitorId();
    if (!visitorId) {
      toast.error('Ошибка идентификации пользователя');
      setIsToggling(false);
      return;
    }

    try {
      const result = await toggleCommentLike(id, visitorId, isLike);
      if (result.success) {
        setLikes(result.likes || 0);
        setDislikes(result.dislikes || 0);
        
        // Обновляем состояние лайка пользователя
        if (userLike === isLike) {
          // Убираем лайк/дизлайк
          setUserLike(null);
        } else {
          // Ставим новый лайк/дизлайк
          setUserLike(isLike);
        }
        
        onLikeChange?.();
      } else {
        toast.error(result.error || 'Не удалось изменить лайк');
      }
    } catch (error) {
      toast.error('Ошибка при изменении лайка');
    } finally {
      setIsToggling(false);
    }
  };
  const getTypeInfo = () => {
    switch (type) {
      case 'WITNESS':
        return {
          icon: <Eye className="w-4 h-4" />,
          label: 'Свидетель',
          color: 'blue',
          bgColor: 'bg-blue-500/10',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500/20',
        };
      case 'ARCHAEOLOGIST':
        return {
          icon: <Camera className="w-4 h-4" />,
          label: 'Археолог',
          color: 'purple',
          bgColor: 'bg-purple-500/10',
          textColor: 'text-purple-400',
          borderColor: 'border-purple-500/20',
        };
      case 'THEORIST':
        return {
          icon: <Brain className="w-4 h-4" />,
          label: 'Теоретик',
          color: 'pink',
          bgColor: 'bg-pink-500/10',
          textColor: 'text-pink-400',
          borderColor: 'border-pink-500/20',
        };
    }
  };

  const typeInfo = getTypeInfo();
  const date = new Date(createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`bg-darkCard border ${typeInfo.borderColor} rounded-xl p-3`}>
      {/* Метаинформация в одну строку */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {/* Тип комментария */}
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${typeInfo.bgColor} ${typeInfo.textColor}`}>
          {typeInfo.icon}
          {typeInfo.label}
        </span>
        
        {/* Теория (если есть) */}
        {theoryType && (
          <span className="px-1.5 py-0.5 rounded text-xs bg-white/5 text-light/60">
            {theoryType}
          </span>
        )}
        
        {/* Дата */}
        <span className="text-xs text-light/40">{date}</span>
        
        {/* Разделитель */}
        <span className="text-xs text-light/20">•</span>
        
        {/* Блок лайков/дизлайков */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => handleLike(true)}
            disabled={isToggling}
            className={`flex items-center gap-1 text-xs transition-colors ${
              userLike === true
                ? 'text-green-400'
                : 'text-light/40 hover:text-light/60'
            } disabled:opacity-50`}
          >
            <ThumbsUp className="w-3 h-3" />
            {likes}
          </button>
          <button
            onClick={() => handleLike(false)}
            disabled={isToggling}
            className={`flex items-center gap-1 text-xs transition-colors ${
              userLike === false
                ? 'text-red-400'
                : 'text-light/40 hover:text-light/60'
            } disabled:opacity-50`}
          >
            <ThumbsDown className="w-3 h-3" />
            {dislikes}
          </button>
        </div>
      </div>

      {/* Текст */}
      <p className="text-sm text-light/80 whitespace-pre-wrap leading-relaxed mb-2">
        {text}
      </p>

      {/* Медиа */}
      {(imageUrl || videoUrl || audioUrl) && (
        <div className="mt-2">
          {imageUrl && (
            <div className="mb-2">
              <MediaPreview imageUrl={imageUrl} />
            </div>
          )}
          {videoUrl && (
            <div className="mb-2">
              <MediaPreview videoUrl={videoUrl} />
            </div>
          )}
          {audioUrl && (
            <div>
              <p className="text-xs text-light/40 mb-1">Аудио:</p>
              <SafeMediaLink url={audioUrl} type="audio">
                Открыть аудио
              </SafeMediaLink>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

