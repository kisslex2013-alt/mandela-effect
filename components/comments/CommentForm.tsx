'use client';

import { useState } from 'react';
import React from 'react';
import { createComment } from '@/app/actions/comments';
import { getVisitorId } from '@/lib/visitor';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { markCommentsAsRead } from '@/lib/comments-tracker';

interface CommentFormProps {
  effectId: string;
  onCommentAdded?: () => void;
}

export default function CommentForm({ effectId, onCommentAdded }: CommentFormProps) {
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Автоматическое изменение высоты textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim() || text.length < 3) {
      toast.error('Введите текст комментария (минимум 3 символа)');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const visitorId = getVisitorId();
      if (!visitorId) {
        toast.error('Ошибка идентификации пользователя');
        return;
      }

      // Определяем тип медиа по URL
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;
      let audioUrl: string | undefined;

      if (mediaUrl) {
        const url = mediaUrl.toLowerCase();
        if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('rutube.ru') || url.includes('vimeo.com') || url.includes('dailymotion.com')) {
          videoUrl = mediaUrl;
        } else if (url.includes('music.yandex.ru') || url.includes('vk.com') || url.includes('soundcloud.com') || url.includes('spotify.com')) {
          audioUrl = mediaUrl;
        } else {
          imageUrl = mediaUrl;
        }
      }

      // Определяем тип комментария: если есть медиа - ARCHAEOLOGIST, иначе WITNESS
      const commentType = (imageUrl || videoUrl || audioUrl) ? 'ARCHAEOLOGIST' : 'WITNESS';

      const result = await createComment({
        effectId,
        visitorId,
        type: commentType,
        text,
        imageUrl,
        videoUrl,
        audioUrl,
      });

      if (result.success) {
        toast.success('Комментарий отправлен на модерацию');
        // Сброс формы
        setText('');
        setMediaUrl('');
        // Отмечаем комментарии как прочитанные, так как пользователь только что создал комментарий
        // Получаем текущее количество одобренных комментариев
        const { getComments } = await import('@/app/actions/comments');
        const commentsResult = await getComments(effectId, visitorId);
        if (commentsResult.success && commentsResult.comments) {
          // Отмечаем текущее количество комментариев как прочитанное
          // Новый комментарий будет учтен после модерации и обновления страницы
          const currentCount = commentsResult.comments.length;
          markCommentsAsRead(effectId, currentCount);
          // Отправляем событие для обновления бейджей на других страницах (каталог, главная)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('comments-read', { detail: { effectId } }));
          }
        } else {
          // Если не удалось получить комментарии, все равно отмечаем как прочитанное
          markCommentsAsRead(effectId, 0);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('comments-read', { detail: { effectId } }));
          }
        }
        onCommentAdded?.();
      } else {
        toast.error(result.error || 'Не удалось создать комментарий');
      }
    } catch (error) {
      console.error('Ошибка при отправке комментария:', error);
      toast.error(`Ошибка при отправке комментария: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Текстовое поле с счетчиком внутри */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ваш комментарий..."
          className="w-full px-4 py-2 pr-16 bg-darkCard border border-light/10 rounded-xl text-sm text-light/70 placeholder-light/40 focus:outline-none focus:border-primary/50 resize-none leading-relaxed overflow-hidden"
          rows={1}
          maxLength={5000}
          style={{ minHeight: '40px', maxHeight: '200px' }}
        />
        <div className="absolute top-2 right-2 text-xs text-light/40 pointer-events-none">
          {text.length} / 5000
        </div>
      </div>

      {/* Поле для ссылки (опционально) */}
      <div>
        <input
          type="url"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="Ссылка на изображение, видео или аудио (необязательно)"
          className="w-full px-4 py-2 bg-darkCard border border-light/10 rounded-lg text-sm text-light/70 placeholder-light/40 focus:outline-none focus:border-primary/50"
        />
        <p className="text-xs text-light/40 mt-1">
          Можно использовать ссылки на imgur, YouTube, Rutube, Яндекс/Google поиск, Яндекс.Музыку, ВКонтакте и другие разрешенные сервисы
        </p>
      </div>

      {/* Кнопка отправки */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Отправка...
          </>
        ) : (
          'Отправить комментарий'
        )}
      </button>

      <p className="text-xs text-light/40 text-center">
        Комментарий будет опубликован после модерации
      </p>
    </form>
  );
}
