'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getComments } from '@/app/actions/comments';
import CommentForm from './CommentForm';
import CommentCard from './CommentCard';
import { Archive, Loader2 } from 'lucide-react';
import { markCommentsAsRead } from '@/lib/comments-tracker';

interface ArchiveAnomaliesProps {
  effectId: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const ChevronDown = () => (
  <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUp = () => (
  <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

export default function ArchiveAnomalies({ effectId, isOpen: externalIsOpen, onToggle: externalOnToggle }: ArchiveAnomaliesProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Используем внешнее состояние если передано, иначе внутреннее
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnToggle || setInternalIsOpen;

  const loadComments = async () => {
    setLoading(true);
    try {
      const { getVisitorId } = await import('@/lib/visitor');
      const visitorId = getVisitorId();
      const result = await getComments(effectId, visitorId || undefined);
      if (result.success && result.comments) {
        setComments(result.comments);
        // Раскрываем аккордеон если есть комментарии (только если используется внутреннее состояние)
        // НЕ открываем автоматически, чтобы не конфликтовать с внешним управлением
      }
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [effectId]);

  // Отмечаем комментарии как прочитанные при открытии аккордеона
  useEffect(() => {
    if (isOpen && comments.length > 0) {
      markCommentsAsRead(effectId, comments.length);
      // Отправляем событие для обновления бейджей на карточках эффектов
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('comments-read', { detail: { effectId } }));
      }
    }
  }, [isOpen, effectId, comments.length]);

  const ArchiveIcon = () => (
    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  );

  const handleToggle = () => {
    if (externalOnToggle) {
      externalOnToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div className={`bg-darkCard border rounded-xl overflow-hidden transition-colors border-purple-500/20 hover:border-purple-500/40`}>
      <button 
        onClick={handleToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ArchiveIcon />
          <span className="font-bold text-light text-sm">Архив Аномалий | Комментарии</span>
          {comments.length > 0 && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp /> : <ChevronDown />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 text-sm text-light/70 leading-relaxed border-t border-white/5 mx-4 mt-2 mb-4">
              {/* Список комментариев - сначала */}
              {loading ? (
                <div className="space-y-4 mb-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-darkCard border border-light/10 rounded-xl p-3 space-y-3 animate-pulse">
                      {/* Заголовок скелетона */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="h-5 w-20 bg-light/10 rounded"></div>
                          <div className="h-4 w-24 bg-light/10 rounded"></div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-4 w-8 bg-light/10 rounded"></div>
                          <div className="h-4 w-8 bg-light/10 rounded"></div>
                        </div>
                      </div>
                      {/* Текст скелетона */}
                      <div className="space-y-2">
                        <div className="h-3 bg-light/10 rounded w-full"></div>
                        <div className="h-3 bg-light/10 rounded w-5/6"></div>
                        <div className="h-3 bg-light/10 rounded w-4/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-2 text-light/40 mb-3">
                  Пока нет комментариев. Будьте первым!
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  {comments.map((comment) => (
                    <CommentCard key={comment.id} {...comment} />
                  ))}
                </div>
              )}

              {/* Форма добавления комментария - внизу */}
              <div className="pt-3 border-t border-white/5">
                <h3 className="text-sm font-bold text-white mb-3">Добавить комментарий</h3>
                <CommentForm 
                  effectId={effectId} 
                  onCommentAdded={loadComments}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

