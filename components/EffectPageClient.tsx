'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Share2, Eye, Calendar, MessageSquare, ChevronRight, ChevronLeft, 
  ChevronDown, Search, BookOpen, BrainCircuit, History, ExternalLink, Lock, 
  Users, AlertTriangle, ThumbsUp, ThumbsDown, Image as ImageIcon, PlayCircle, 
  Mic, Plus, X, Loader2, Maximize2, Sparkles, RotateCw
} from 'lucide-react';
import Link from 'next/link';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import StrangerVote from '@/components/ui/StrangerVote';
import dynamic from 'next/dynamic';

const ShareModal = dynamic(() => import('@/components/ui/ShareModal'), { ssr: false });
import { saveVote, getUserVote } from '@/app/actions/votes';
import { createComment, toggleCommentLike } from '@/app/actions/comments';
import { incrementViews, getNextUnvotedEffect, getPrevUnvotedEffect } from '@/app/actions/effects';
import { getCategoryInfo } from '@/lib/constants';
import { votesStore } from '@/lib/votes-store';
import { getClientVisitorId } from '@/lib/client-visitor';
import toast from 'react-hot-toast';
import { useReality } from '@/lib/context/RealityContext';
import RealitySwitch from '@/components/ui/RealitySwitch';
import CipherReveal from '@/components/ui/CipherReveal';
import RedactedText from '@/components/ui/RedactedText';
import RedactedWords from '@/components/ui/RedactedWords';

// --- TYPES ---
interface EffectPageClientProps {
  effect: any;
  initialUserVote: 'A' | 'B' | null;
  prevEffect?: { id: string; title: string } | null;
  nextEffect?: { id: string; title: string } | null;
}

// --- COMPONENTS ---

// 0. Лайтбокс для картинок
const ImageLightbox = ({ src, onClose }: { src: string | null, onClose: () => void }) => {
  if (!src) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
        <X className="w-8 h-8" />
      </button>
      <div className="relative w-full h-full max-w-5xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <img src={src} alt="Full view" className="w-full h-full object-contain" />
      </div>
    </div>
  );
};

// 1. Аккордеон (контролируемый компонент)
const AccordionItem = ({ title, icon: Icon, children, color = "cyan", sourceLink, isOpen, onToggle, isLocked = false }: any) => {
  const colorClassesMap: Record<string, string> = {
    cyan: "text-cyan-400 border-cyan-500/30 bg-cyan-950/20",
    red: "text-red-400 border-red-500/30 bg-red-950/20",
    purple: "text-purple-400 border-purple-500/30 bg-purple-950/20",
    orange: "text-orange-400 border-orange-500/30 bg-orange-950/20",
  };
  const colorClasses = colorClassesMap[color] || "text-cyan-400 border-cyan-500/30 bg-cyan-950/20";

  const handleToggle = () => {
    if (isLocked || !onToggle) return;
    onToggle();
  };

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${isOpen ? colorClasses : "border-white/10 bg-darkCard"} ${isLocked ? 'opacity-50' : ''}`}>
      <button 
        onClick={handleToggle} 
        disabled={isLocked}
        className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
          isLocked 
            ? 'cursor-not-allowed opacity-50' 
            : 'hover:bg-white/5 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${isOpen ? "" : "text-light/50"}`} />
          <span className={`font-bold text-lg ${isOpen ? "" : "text-light/70"}`}>{title}</span>
          {isLocked && <Lock className="w-4 h-4 text-white/40 ml-2" />}
        </div>
        {isLocked ? (
          <Lock className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        )}
      </button>
      <AnimatePresence>
        {isOpen && !isLocked && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-4 pt-0 text-light/80 leading-relaxed whitespace-pre-line border-t border-white/5">
              {children}
              {sourceLink && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <a href={sourceLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-light/50 hover:text-primary transition-colors">
                    <ExternalLink className="w-3 h-3" /> Источник / Подтверждение
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 2. Комментарий
const CommentItem = ({ comment, onImageClick }: { comment: any, onImageClick: (src: string) => void }) => {
  const [likes, setLikes] = useState(comment.likes || 0);
  const [hasLiked, setHasLiked] = useState(false); // В идеале нужно проверять на сервере, лайкал ли юзер

  const handleLike = async () => {
    // Оптимистичное обновление
    const newHasLiked = !hasLiked;
    setHasLiked(newHasLiked);
    setLikes((prev: number) => newHasLiked ? prev + 1 : prev - 1);
    
    if (newHasLiked) toast.success('Голос учтен');

    try {
      const visitorId = getClientVisitorId();
      if (visitorId) {
        await toggleCommentLike(comment.id, visitorId);
      }
    } catch (e) {
      console.error(e);
      // Откат при ошибке
      setHasLiked(!newHasLiked);
      setLikes((prev: number) => !newHasLiked ? prev + 1 : prev - 1);
    }
  };

  const handleDislike = () => {
    if (hasLiked) return;
    setHasLiked(true);
    toast.success('Мнение учтено');
  };

  return (
    <div className="relative p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
      {/* Лайки в правом верхнем углу */}
      <div className="absolute top-3 right-3 flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
        <button onClick={handleLike} disabled={hasLiked} className={`flex items-center gap-1 text-xs transition-colors ${hasLiked ? 'text-green-400 cursor-default' : 'text-light/60 hover:text-green-400'}`}>
          <ThumbsUp className="w-3.5 h-3.5" /> {likes}
        </button>
        <button onClick={handleDislike} disabled={hasLiked} className={`flex items-center gap-1 text-xs transition-colors ${hasLiked ? 'text-red-400 cursor-default' : 'text-light/60 hover:text-red-400'}`}>
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex justify-between items-start mb-2 pr-20">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            comment.type === 'WITNESS' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
          }`}>
            {comment.type === 'WITNESS' ? 'Свидетель' : 'Теоретик'}
          </span>
          <span className="text-[10px] text-light/30">{new Date(comment.createdAt).toLocaleDateString('ru-RU')}</span>
        </div>
      </div>
      
      <p className="text-sm text-light/80 mb-3 whitespace-pre-wrap">{comment.text}</p>
      
      {(comment.imageUrl || comment.videoUrl || comment.audioUrl) && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {comment.imageUrl && (
            <button onClick={() => onImageClick(comment.imageUrl)} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-white/10 group/img cursor-zoom-in">
              <img src={comment.imageUrl} alt="Evidence" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </button>
          )}
          {comment.videoUrl && (
            <a href={comment.videoUrl} target="_blank" rel="noopener noreferrer" className="w-20 h-20 shrink-0 rounded-lg bg-red-900/20 border border-red-500/30 flex flex-col items-center justify-center text-red-400 hover:bg-red-900/40 transition-colors">
              <PlayCircle className="w-8 h-8 mb-1" />
              <span className="text-[8px] uppercase font-bold">Video</span>
            </a>
          )}
          {comment.audioUrl && (
            <a href={comment.audioUrl} target="_blank" rel="noopener noreferrer" className="w-20 h-20 shrink-0 rounded-lg bg-purple-900/20 border border-purple-500/30 flex flex-col items-center justify-center text-purple-400 hover:bg-purple-900/40 transition-colors">
              <Mic className="w-8 h-8 mb-1" />
              <span className="text-[8px] uppercase font-bold">Audio</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// 3. Модалка добавления комментария
const AddCommentModal = ({ isOpen, onClose, effectId }: any) => {
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!text.trim()) return toast.error('Напишите что-нибудь');
    setLoading(true);
    try {
      const visitorId = getClientVisitorId();

      const result = await createComment({
        effectId,
        visitorId,
        type: 'WITNESS',
        text,
        imageUrl: link.includes('jpg') || link.includes('png') || link.includes('webp') ? link : undefined,
        videoUrl: link.includes('youtube') || link.includes('youtu.be') ? link : undefined,
      });

      if (result.success) {
        toast.success('Запись отправлена на модерацию');
        onClose();
        setText('');
        setLink('');
      } else {
        toast.error('Ошибка отправки');
      }
    } catch (e) {
      toast.error('Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-darkCard w-full max-w-lg rounded-2xl border border-light/10 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Добавить запись в архив</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-light/50 hover:text-white" /></button>
        </div>

        <textarea 
          value={text} 
          onChange={e => setText(e.target.value)} 
          rows={5} 
          className="w-full bg-dark border border-light/10 rounded-xl p-4 text-light placeholder:text-light/20 focus:border-primary outline-none mb-4 resize-none"
          placeholder="Опишите ваше воспоминание или теорию..."
        />

        <div className="mb-6">
          <label className="block text-xs text-light/40 mb-2 ml-1">Ссылка на доказательство (Фото/Видео)</label>
          <input 
            type="text" 
            value={link} 
            onChange={e => setLink(e.target.value)} 
            className="w-full bg-dark border border-light/10 rounded-xl p-3 text-sm text-light focus:border-primary outline-none"
            placeholder="https://..."
          />
        </div>

        <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Отправить в архив
        </button>
      </motion.div>
    </div>
  );
};

// --- ГЕНЕРАТОР СООБЩЕНИЙ (Вместо статического массива) ---
const generateSystemMessage = (id: string = 'default') => {
  // Хэш для стабильности (чтобы на одной странице текст не скакал при ре-рендере)
  const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const prefixes = ["CRITICAL_DESYNC", "MEMORY_CORRUPTION", "TIMELINE_DIVERGENCE", "REALITY_BREACH", "PATTERN_VOID", "ERR_NO_CONTEXT", "SYSTEM_ALERT"];
  const bodies = [
    "НАРУШЕНИЕ ЦЕЛОСТНОСТИ ВОСПОМИНАНИЙ", "ТРЕБУЕТСЯ ПОДТВЕРЖДЕНИЕ НАБЛЮДАТЕЛЯ", "ДОСТУП ОГРАНИЧЕН ПРОТОКОЛОМ 'ОМЕГА'",
    "СБОЙ СИНХРОНИЗАЦИИ НЕЙРОИНТЕРФЕЙСА", "ОБНАРУЖЕНЫ СЛЕДЫ ВМЕШАТЕЛЬСТВА", "АРХИВ ЗАШИФРОВАН АЛГОРИТМОМ МАНДЕЛЫ",
    "ВРЕМЕННАЯ ЛИНИЯ НЕСТАБИЛЬНА", "ОБЪЕКТ НЕ НАЙДЕН В ТЕКУЩЕЙ РЕАЛЬНОСТИ"
  ];
  const suffixes = [":: INITIATE_VOTE", ":: WAITING_FOR_INPUT...", "// REBOOT_REQUIRED", ":: SYNC_PENDING", ":: ACCESS_DENIED", "-> TRACE_LOST"];

  const pick = (arr: string[], offset: number) => arr[(seed + offset) % arr.length];

  return `${pick(prefixes, 0)} :: ${pick(bodies, 1)} ${pick(suffixes, 2)}`;
};

// 4. Заглушка (С размытым текстом)
const LockedContent = ({ isVisible, isUpsideDown = false, effectId }: { isVisible: boolean; isUpsideDown?: boolean; effectId?: string }) => {
  // Получаем контекст для определения стадии иконки
  let voteCount = 0;
  let requiredVotes = 25;
  try {
    const reality = useReality();
    voteCount = reality.voteCount;
    requiredVotes = reality.requiredVotes;
  } catch (error) {
    // Игнорируем ошибку, используем значения по умолчанию
  }
  
  // Определяем стадию для иконки (как в RealitySwitch)
  let stage = 0;
  if (voteCount >= 25) stage = 3;
  else if (voteCount >= 20) stage = 2;
  else if (voteCount >= 10) stage = 1;
  
  // Генерируем системное сообщение для режима Реальности
  const systemMessage = generateSystemMessage(effectId || 'default');
  
  // Определяем заголовок и описание
  const title = !isUpsideDown ? "ДОСТУП ЗАПРЕЩЕН" : "ПАМЯТЬ НЕ ВЕРИФИЦИРОВАНА";
  const description = !isUpsideDown 
    ? systemMessage 
    : "Система не может подтвердить вашу версию событий. Чтобы получить доступ к Архивам Аномалий, зафиксируйте своё воспоминание выше.";
  
  const isSystemMessage = !isUpsideDown; // Флаг для стилизации
  
  // Подсказка действия
  const actionHint = !isUpsideDown
    ? ">>> ТРЕБУЕТСЯ ПЕРЕХОД" 
    : ">>> ТРЕБУЕТСЯ ГОЛОС";
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="relative bg-darkCard/50 border border-white/10 rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[180px] mt-4 group overflow-hidden"
        >
          {/* Фоновые эффекты */}
          <div className="absolute inset-0 pointer-events-none z-0 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)] mix-blend-screen" />
            <div className="spore-locked" style={{ left: '10%', top: '80%', animationDelay: '0s' }} />
            <div className="spore-locked" style={{ left: '80%', top: '90%', animationDelay: '-2s' }} />
            <div className="spore-locked" style={{ left: '40%', top: '70%', animationDelay: '-4s' }} />
            <div className="spore-locked" style={{ left: '20%', top: '60%', animationDelay: '-1s' }} />
            <div className="spore-locked" style={{ left: '70%', top: '85%', animationDelay: '-3s' }} />
          </div>

          {/* Контент */}
          <div className="relative z-10 flex flex-col items-center w-full max-w-xl">
            <Lock className="w-8 h-8 text-white/20 mb-3 group-hover:text-white/40 transition-colors" />
            <h3 className="text-lg font-bold text-white mb-3 tracking-wide uppercase">{title}</h3>
            
            {/* Единая карточка системы (Компактная) */}
            <div className="w-full bg-black/40 border border-white/10 rounded-lg overflow-hidden backdrop-blur-md shadow-lg">
                <div className="p-3 text-left border-b border-white/5">
                    <p className={`text-xs leading-relaxed font-mono ${
                        isSystemMessage ? 'text-green-400' : 'text-light/70'
                    }`}>
                        <span className="opacity-50 mr-2">$</span>
                        {description}
                    </p>
                    
                    {isSystemMessage && (
                        <p className="text-[10px] text-green-500/60 mt-2 font-mono uppercase tracking-widest animate-pulse">
                            {actionHint}
                        </p>
                    )}
                </div>

                {/* Нижняя часть: Панель управления (Кнопка) */}
                {!isUpsideDown && (
                    <div className="bg-white/5 p-2 flex justify-center items-center relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-900/10 pointer-events-none" />
                        <div className="relative z-50 scale-90 transform transition-transform hover:scale-100 pointer-events-auto cursor-pointer">
                            <RealitySwitch />
                        </div>
                    </div>
                )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- MAIN COMPONENT ---
export default function EffectPageClient({ effect, initialUserVote, prevEffect, nextEffect }: EffectPageClientProps) {
  // Получаем контекст Reality
  let isUpsideDown = false;
  try {
    const reality = useReality();
    isUpsideDown = reality.isUpsideDown;
  } catch (error) {
    // Fallback to false
  }
  
  const [userVote, setUserVote] = useState(initialUserVote);
  const [votes, setVotes] = useState({ for: effect.votesFor, against: effect.votesAgainst });
  const [isVoting, setIsVoting] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [nextUnvotedEffect, setNextUnvotedEffect] = useState<{ id: string; title: string } | null>(null);
  const [prevUnvotedEffect, setPrevUnvotedEffect] = useState<{ id: string; title: string } | null>(null);
  const [showUnvotedOnly, setShowUnvotedOnly] = useState(true); // Фильтр активен по умолчанию
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null); // ID эффекта, к которому идет навигация
  
  // Защита от повторных вызовов голосования
  const isVotingRef = useRef(false);
  
  // Состояние для взаимоисключающих аккордеонов (Остатки, История, Теории)
  const [openExclusiveAccordion, setOpenExclusiveAccordion] = useState<string | null>(null);
  
  // Состояния для независимых аккордеонов (Факты)
  const [isFactsOpen, setIsFactsOpen] = useState<boolean>(false);
  
  const votingCardRef = useRef<HTMLDivElement>(null);
  const infoBlockRef = useRef<HTMLDivElement>(null);
  const lockedContentRef = useRef<HTMLDivElement>(null);
  const commentsBlockRef = useRef<HTMLDivElement>(null);

  const categoryInfo = getCategoryInfo(effect.category);
  const CategoryIcon = categoryInfo.icon;
  
  // Логика доступа к аккордеонам: только в режиме Изнанка И с голосом
  const hasAccess = isUpsideDown && !!userVote;
  
  // Логика доступа к комментариям: после голосования в любом режиме
  const hasAccessComments = !!userVote;
  
  // Функция для переключения взаимоисключающих аккордеонов
  const handleExclusiveAccordionToggle = useCallback((id: string) => {
    setOpenExclusiveAccordion(current => current === id ? null : id);
  }, []);
  
  // Синхронизация состояния аккордеонов при переключении режима
  useEffect(() => {
    if (!isUpsideDown) {
      setOpenExclusiveAccordion(null);
      setIsFactsOpen(false);
    } else {
      setOpenExclusiveAccordion(null);
    }
  }, [isUpsideDown]);

  // Сбрасываем индикацию загрузки при монтировании (когда страница загрузилась)
  useEffect(() => {
    setNavigatingTo(null);
  }, [effect.id]);

  useEffect(() => {
    const initPage = async () => {
      const visitorId = getClientVisitorId();
      
      // 1. Проверяем голос на сервере
      if (visitorId) {
        const result = await getUserVote(visitorId, effect.id);
        if (result && result.variant) {
          const variant = result.variant as 'A' | 'B';
          setUserVote(variant);
          // СИНХРОНИЗАЦИЯ: Сохраняем голос в локальный стор, чтобы он был виден в каталоге
          votesStore.set(effect.id, variant);
        }
      }

      // 2. Инкрементируем просмотры (с защитой от накрутки в сессии)
      const viewedKey = `viewed_${effect.id}`;
      if (!sessionStorage.getItem(viewedKey)) {
        await incrementViews(effect.id);
        sessionStorage.setItem(viewedKey, 'true');
      }
    };
    
    initPage();
  }, [effect.id]);

  // Синхронизация высоты блока "Информация" с блоком "Голосование" (только при первой загрузке)
  useEffect(() => {
    const syncHeights = () => {
      if (votingCardRef.current && infoBlockRef.current) {
        const votingHeight = votingCardRef.current.offsetHeight;
        // Устанавливаем minHeight только один раз при загрузке, не меняем после голосования
        if (!infoBlockRef.current.dataset.heightSet) {
          infoBlockRef.current.style.minHeight = `${votingHeight}px`;
          infoBlockRef.current.dataset.heightSet = 'true';
        }
      }
      
      // Синхронизация высоты блока "Архив Аномалий" с LockedContent когда доступ закрыт
      if (!hasAccessComments && lockedContentRef.current && commentsBlockRef.current) {
        const lockedHeight = lockedContentRef.current.offsetHeight;
        commentsBlockRef.current.style.minHeight = `${lockedHeight}px`;
      } else if (hasAccessComments && commentsBlockRef.current) {
        commentsBlockRef.current.style.minHeight = 'auto';
      }
    };

    syncHeights();
    window.addEventListener('resize', syncHeights);
    
    // Небольшая задержка для учета анимаций
    const timeout = setTimeout(syncHeights, 100);
    
    return () => {
      window.removeEventListener('resize', syncHeights);
      clearTimeout(timeout);
    };
  }, [hasAccessComments]); // Пересчитываем только при изменении доступа к комментариям

  // Если пришёл initialUserVote, записываем его в локальный store, чтобы превью в каталоге/главной знали о голосе
  useEffect(() => {
    if (initialUserVote) {
      votesStore.set(effect.id, initialUserVote);
    }
  }, [effect.id, initialUserVote]);

  // Получаем следующий и предыдущий не проголосованные эффекты (только если фильтр включен)
  useEffect(() => {
    if (showUnvotedOnly) {
      const fetchUnvotedEffects = async () => {
        const votes = votesStore.get();
        const votedIds = Object.keys(votes);
        const [nextResult, prevResult] = await Promise.all([
          getNextUnvotedEffect(effect.id, votedIds),
          getPrevUnvotedEffect(effect.id, votedIds),
        ]);
        if (nextResult.success) {
          setNextUnvotedEffect(nextResult.data ?? null);
        }
        if (prevResult.success) {
          setPrevUnvotedEffect(prevResult.data ?? null);
        }
      };
      fetchUnvotedEffects();
    } else {
      setNextUnvotedEffect(null);
      setPrevUnvotedEffect(null);
    }
  }, [effect.id, showUnvotedOnly]);

  // Всегда используем стандартные тексты для вариантов ответа
  const vA = "Как я помню";
  const vB = "Как в реальности";

  const handleVote = async (variant: 'A' | 'B') => {
    // Защита от повторных вызовов
    if (isVoting || userVote || isVotingRef.current) return;

    isVotingRef.current = true;
    setIsVoting(true);
    setUserVote(variant);
    setVotes(prev => ({ ...prev }));
    votesStore.set(effect.id, variant); // локально фиксируем голос для синхронизации превью

    try {
      const visitorId = getClientVisitorId();
      
      // Таймаут для предотвращения зависания
      const votePromise = saveVote({ visitorId, effectId: effect.id, variant });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Vote timeout')), 8000)
      );
      
      const result = await Promise.race([votePromise, timeoutPromise]) as Awaited<ReturnType<typeof saveVote>>;
      if (!result.success) {
        if (result.vote) { 
          setUserVote(result.vote.variant as 'A' | 'B'); 
          votesStore.set(effect.id, result.vote.variant as 'A' | 'B');
          toast.success('Вы уже голосовали'); 
        }
        else { 
          setUserVote(null); 
          setVotes({ for: effect.votesFor, against: effect.votesAgainst }); 
          // откат локального голоса: если был initialUserVote, восстановим; иначе удалим запись
          if (initialUserVote) votesStore.set(effect.id, initialUserVote);
          else {
            const votes = votesStore.get();
            delete votes[effect.id];
            localStorage.setItem('mandela_votes', JSON.stringify(votes));
            window.dispatchEvent(new Event('votes-updated'));
          }
          toast.error('Ошибка'); 
        }
      } else { 
        toast.success('Голос записан');
        votesStore.set(effect.id, variant);
      }
    } catch (error) {
      console.error('[EffectPageClient] Ошибка при голосовании:', error);
      setUserVote(null); 
      if (initialUserVote) votesStore.set(effect.id, initialUserVote);
      else {
        const votes = votesStore.get();
        delete votes[effect.id];
        localStorage.setItem('mandela_votes', JSON.stringify(votes));
        window.dispatchEvent(new Event('votes-updated'));
      }
      toast.error('Ошибка при сохранении голоса');
    } finally { 
      setIsVoting(false);
      isVotingRef.current = false;
    }
  };

  return (
    <motion.div 
      key={effect.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-dark text-light pb-20"
    >
      {/* Hero Section */}
      <motion.div 
        key={`hero-${effect.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative h-[50vh] w-full overflow-hidden group glitch-wrapper ${isUpsideDown ? 'glitch-mirror' : ''}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark/60 to-dark z-10" />
        {effect.imageUrl && (
          <>
            <ImageWithSkeleton src={effect.imageUrl} alt={effect.title} fill className="object-cover opacity-60 relative z-[1]" />
            {/* ГЛИТЧ СЛОИ: Рендерим всегда, стиль меняется через CSS класс родителя */}
            {effect.imageUrl && (
              <div className={`glitch-layers absolute inset-0 z-[2] opacity-0 group-hover:opacity-100 transition-opacity ${isUpsideDown ? '' : 'glitch-reality'}`}>
                <div className="glitch-layer" style={{ backgroundImage: `url('${effect.imageUrl.replace(/'/g, '%27')}')` }} />
                <div className="glitch-layer" style={{ backgroundImage: `url('${effect.imageUrl.replace(/'/g, '%27')}')` }} />
                <div className="glitch-layer" style={{ backgroundImage: `url('${effect.imageUrl.replace(/'/g, '%27')}')` }} />
              </div>
            )}
          </>
        )}
        
        <div className="absolute inset-0 z-20 container mx-auto px-4 flex flex-col justify-end pb-12">
          <Link href="/catalog" className="inline-flex items-center gap-2 text-light/60 hover:text-primary mb-6 transition-colors w-fit"><ArrowLeft className="w-4 h-4" /> Назад в каталог</Link>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 w-fit mb-4 ${categoryInfo.color} bg-opacity-10 text-xs font-bold uppercase tracking-wider`}><CategoryIcon className="w-4 h-4" /> {categoryInfo.name}</div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-lg">
            {isUpsideDown ? (
              <CipherReveal text={effect.title} reveal={true} />
            ) : (
              effect.title
            )}
          </h1>
          <p className="text-xl text-light/80 max-w-2xl leading-relaxed">
            {effect.description}
            {isUpsideDown && (
              <span className="ml-2">
                <RedactedText text="[ДАННЫЕ УДАЛЕНЫ]" />
              </span>
            )}
          </p>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 -mt-8 relative z-30 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Voting Card */}
          <div ref={votingCardRef} className="bg-darkCard border border-light/10 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3"><span className="w-1 h-8 bg-primary rounded-full"></span>Голосование</h2>
              
              {/* Navigation Buttons */}
              <div className="flex gap-2 items-center justify-center">
                {showUnvotedOnly && prevUnvotedEffect ? (
                  <Link 
                    href={`/effect/${prevUnvotedEffect.id}`} 
                    onClick={() => setNavigatingTo(prevUnvotedEffect.id)}
                    className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 text-light/50 hover:text-white transition-colors flex items-center justify-center ${
                      navigatingTo === prevUnvotedEffect.id ? 'opacity-50 cursor-wait' : ''
                    }`}
                    title={`Предыдущий не проголосованный: ${prevUnvotedEffect.title}`}
                  >
                    {navigatingTo === prevUnvotedEffect.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ChevronLeft className="w-5 h-5" />
                    )}
                  </Link>
                ) : prevEffect ? (
                  <Link 
                    href={`/effect/${prevEffect.id}`} 
                    onClick={() => setNavigatingTo(prevEffect.id)}
                    className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 text-light/50 hover:text-white transition-colors flex items-center justify-center ${
                      navigatingTo === prevEffect.id ? 'opacity-50 cursor-wait' : ''
                    }`}
                    title={`Предыдущий: ${prevEffect.title}`}
                  >
                    {navigatingTo === prevEffect.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ChevronLeft className="w-5 h-5" />
                    )}
                  </Link>
                ) : <div className="w-9 h-9" />}
                <button
                  onClick={() => setShowUnvotedOnly(!showUnvotedOnly)}
                  className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                    showUnvotedOnly 
                      ? 'bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                      : 'bg-white/5 hover:bg-white/10 text-light/50 hover:text-white'
                  }`}
                  title={showUnvotedOnly ? 'Показать все эффекты' : 'Показать только не проголосованные'}
                >
                  <Sparkles className="w-5 h-5" />
                </button>
                {showUnvotedOnly && nextUnvotedEffect ? (
                  <Link 
                    href={`/effect/${nextUnvotedEffect.id}`} 
                    onClick={() => setNavigatingTo(nextUnvotedEffect.id)}
                    className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 text-light/50 hover:text-white transition-colors flex items-center justify-center ${
                      navigatingTo === nextUnvotedEffect.id ? 'opacity-50 cursor-wait' : ''
                    }`}
                    title={`Следующий не проголосованный: ${nextUnvotedEffect.title}`}
                  >
                    {navigatingTo === nextUnvotedEffect.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </Link>
                ) : nextEffect ? (
                  <Link 
                    href={`/effect/${nextEffect.id}`} 
                    onClick={() => setNavigatingTo(nextEffect.id)}
                    className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 text-light/50 hover:text-white transition-colors flex items-center justify-center ${
                      navigatingTo === nextEffect.id ? 'opacity-50 cursor-wait' : ''
                    }`}
                    title={`Следующий: ${nextEffect.title}`}
                  >
                    {navigatingTo === nextEffect.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </Link>
                ) : <div className="w-9 h-9" />}
              </div>
            </div>
            
            <StrangerVote variantA={vA} variantB={vB} votesFor={votes.for} votesAgainst={votes.against} userVote={userVote} onVote={handleVote} isVoting={isVoting} />
            
            {/* Блок с фактами - появляется после голосования */}
            <AnimatePresence>
              {userVote && effect.currentState && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="mt-6 pt-6 border-t border-cyan-500/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-lg text-cyan-400">Текущее состояние | Факты</h3>
                  </div>
                  <div className="text-light/80 leading-relaxed whitespace-pre-line">
                    <RedactedWords text={effect.currentState} minWords={1} maxWords={5} seed={effect.id} />
                  </div>
                  {effect.interpretations?.sourceLink && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <a href={effect.interpretations.sourceLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-light/50 hover:text-primary transition-colors">
                        <ExternalLink className="w-3 h-3" /> Источник / Подтверждение
                      </a>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Accordions - ЛОГИКА ОТОБРАЖЕНИЯ */}
          {(() => {
            // В режиме Реальности: показываем только заглушку
            if (!isUpsideDown) {
              return (
                <div ref={lockedContentRef}>
                  <LockedContent isVisible={true} isUpsideDown={false} effectId={effect.id} />
                </div>
              );
            }
            
            // В режиме Изнанки БЕЗ голоса: показываем заглушку
            if (isUpsideDown && !userVote) {
              return (
                <div ref={lockedContentRef}>
                  <LockedContent isVisible={true} isUpsideDown={true} effectId={effect.id} />
                </div>
              );
            }
            
            // В режиме Изнанки С голосом: показываем все аккордеоны
            return (
              <AnimatePresence mode="wait">
                <motion.div 
                  key="accordions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-4"
                >
                  {/* Факты НЕ показываем здесь - они уже показаны после голосования */}
                  
                  {/* Остатки - ВЗАИМОИСКЛЮЧАЮЩИЙ */}
                  {effect.residue && (
                    <AccordionItem 
                      title="Культурные следы | Остатки" 
                      icon={Search} 
                      color="red" 
                      sourceLink={effect.residueSource}
                      isOpen={openExclusiveAccordion === 'residue'}
                      onToggle={() => handleExclusiveAccordionToggle('residue')}
                      isLocked={false}
                    >
                      {effect.residue}
                    </AccordionItem>
                  )}
                  
                  {/* История - ВЗАИМОИСКЛЮЧАЮЩИЙ */}
                  {effect.history && (
                    <AccordionItem 
                      title="Временная шкала | История" 
                      icon={History} 
                      color="orange" 
                      sourceLink={effect.historySource}
                      isOpen={openExclusiveAccordion === 'history'}
                      onToggle={() => handleExclusiveAccordionToggle('history')}
                      isLocked={false}
                    >
                      {effect.history}
                    </AccordionItem>
                  )}
                  
                  {/* Теории - ВЗАИМОИСКЛЮЧАЮЩИЙ */}
                  {(effect.interpretations?.scientific || effect.interpretations?.community) && (
                    <AccordionItem 
                      title="Что об этом говорят | Теории" 
                      icon={BrainCircuit} 
                      color="purple"
                      isOpen={openExclusiveAccordion === 'theories'}
                      onToggle={() => handleExclusiveAccordionToggle('theories')}
                      isLocked={false}
                    >
                      {effect.interpretations?.scientific && (
                        <div className="mb-4">
                          <h4 className="font-bold text-purple-300 mb-2 flex items-center gap-2"><BrainCircuit className="w-4 h-4" /> Научная точка зрения</h4>
                          <p>{effect.interpretations.scientific}</p>
                          {effect.interpretations?.scientificSource && <a href={effect.interpretations.scientificSource} target="_blank" className="text-xs text-purple-400/60 hover:text-purple-400 mt-1 block">Источник</a>}
                        </div>
                      )}
                      {effect.interpretations?.community && (
                        <div className="pt-4 border-t border-purple-500/20">
                          <h4 className="font-bold text-purple-300 mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Теории сообщества</h4>
                          <p>{effect.interpretations.community}</p>
                          {effect.interpretations?.communitySource && <a href={effect.interpretations.communitySource} target="_blank" className="text-xs text-purple-400/60 hover:text-purple-400 mt-1 block">Источник</a>}
                        </div>
                      )}
                    </AccordionItem>
                  )}
                </motion.div>
              </AnimatePresence>
            );
          })()}

        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-6">
          {/* Info Block */}
          <div ref={infoBlockRef} className="bg-darkCard border border-light/10 rounded-xl p-4 flex flex-col">
            <h3 className="font-bold text-white mb-3 text-sm">Информация</h3>
            <div className="space-y-2 text-xs flex-grow">
              <div className="flex justify-between py-1.5 border-b border-white/5"><span className="text-light/50 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Просмотры</span><span className="text-white">{effect.views}</span></div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-light/50 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Добавлено</span>
                <span className="text-white">{new Date(effect.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex justify-between py-1.5"><span className="text-light/50 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Обсуждения</span><span className="text-white">{effect._count?.comments || 0}</span></div>
            </div>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="w-full mt-auto py-2 bg-white/5 hover:bg-white/10 rounded-lg text-light text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> Поделиться
            </button>
          </div>

          {/* Comments Block */}
          <div ref={commentsBlockRef} className="bg-darkCard border border-light/10 rounded-xl p-6 sticky top-24 flex flex-col" style={{ minHeight: hasAccessComments ? 'auto' : '300px' }}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Архив Аномалий</h3>
            
            <AnimatePresence mode="wait">
              {hasAccessComments ? (
                <motion.div
                  key="comments-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex-1 flex flex-col"
                >
                  {effect.comments && effect.comments.length > 0 ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar mb-4">
                      {effect.comments.map((comment: any) => (
                        <CommentItem key={comment.id} comment={comment} onImageClick={setLightboxImage} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-light/40 text-sm border-2 border-dashed border-white/10 rounded-lg mb-4">
                      <p>Архив пуст. Станьте первым свидетелем.</p>
                    </div>
                  )}
                  <button onClick={() => setIsCommentModalOpen(true)} className="w-full mt-auto py-3 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold rounded-xl transition-colors border border-primary/20 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Добавить запись
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="comments-locked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex-1 flex flex-col items-center justify-center text-center py-8 text-light/40 text-sm"
                >
                  <Lock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Доступ к архиву закрыт.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AddCommentModal isOpen={isCommentModalOpen} onClose={() => setIsCommentModalOpen(false)} effectId={effect.id} />
      <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        effectId={effect.id}
        effectTitle={effect.title}
        effectDescription={effect.description}
        effectImageUrl={effect.imageUrl}
      />
    </motion.div>
  );
}
