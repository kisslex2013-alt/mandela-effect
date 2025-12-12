'use client';

import { useState, useEffect, startTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { m, AnimatePresence } from 'framer-motion';
import { MessageSquare, Share2, Eye, HelpCircle, X, Copy, Check, Send, Twitter } from 'lucide-react';
import { saveVote } from '@/app/actions/votes';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import StrangerVote from '@/components/ui/StrangerVote';
import { getCategoryInfo } from '@/lib/constants';
import { votesStore } from '@/lib/votes-store';
import { useReality } from '@/lib/context/RealityContext';
import { getClientVisitorId } from '@/lib/client-visitor'; // ИМПОРТ
import toast from 'react-hot-toast';

// VK Icon Component
const VKIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zM17.6 14.5c.3.44.76 1.18.95 1.5.17.28.15.42-.06.42h-2.1c-.72 0-1.05-.38-1.6-1.3-.2-.33-.45-.67-.6-.67-.13 0-.18.1-.18.6v1.37c0 .2-.06.33-.55.33-1.8 0-3.8-1.08-5.25-3.1-2.18-3.05-2.8-5.35-2.8-5.68 0-.15.06-.28.35-.28h2.1c.27 0 .37.12.47.4.52 1.5 1.4 2.8 1.75 2.8.13 0 .2-.06.2-.38V8.6c-.05-.85-.5-1.05-.5-1.4 0-.15.12-.3.32-.3h2c.27 0 .36.13.36.43v2.25c0 .25.1.33.17.33.14 0 .25-.08.5-.33 1-1.1 1.7-2.68 1.7-2.68.1-.2.25-.3.6-.3h2.1c.63 0 .76.32.62.75-.3.98-2.2 3.68-2.2 3.68-.18.28-.25.4 0 .75z"/>
  </svg>
);

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

interface EffectCardProps {
  effect?: {
    id: string;
    title: string;
    description: string;
    content: string;
    category: string;
    imageUrl: string | null;
    votesFor: number;
    votesAgainst: number;
    views: number;
    _count?: { comments: number };
    commentsCount?: number;
  };
  id?: string;
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  imageUrl?: string | null;
  votesFor?: number;
  votesAgainst?: number;
  views?: number;
  commentsCount?: number;
  _count?: { comments: number };
  initialUserVote?: 'A' | 'B' | null;
  hasVoted?: boolean;
  showProgress?: boolean;
  priority?: boolean;
  className?: string;
  badge?: string;
  hasNewComments?: boolean;
  commentsWithMediaCount?: number;
}

export default function EffectCard(props: EffectCardProps) {
  const router = useRouter();
  // Получаем функцию из контекста
  const { incrementVotes, isUpsideDown } = useReality(); // ПОЛУЧАЕМ isUpsideDown
  
  const effectData = props.effect || {
    id: props.id!,
    title: props.title!,
    description: props.description!,
    content: props.content || '',
    category: props.category!,
    imageUrl: props.imageUrl || null,
    votesFor: props.votesFor || 0,
    votesAgainst: props.votesAgainst || 0,
    views: props.views || 0,
    _count: props._count || { comments: props.commentsCount || 0 },
  };
  
  // Получаем количество комментариев из разных источников (приоритет: effect.commentsCount > props.commentsCount > _count.comments)
  const commentsCount = (props.effect as any)?.commentsCount ?? 
                        props.commentsCount ?? 
                        effectData._count?.comments ?? 
                        0;

  const [userVote, setUserVote] = useState<'A' | 'B' | null>(
    props.initialUserVote || (props.hasVoted ? 'A' : null)
  );
  
  const [votes, setVotes] = useState({ 
    for: effectData.votesFor, 
    against: effectData.votesAgainst 
  });
  const [isVoting, setIsVoting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const categoryInfo = getCategoryInfo(effectData.category);
  const CategoryIcon = categoryInfo.icon;

  useEffect(() => {
    const localVotes = votesStore.get();
    if (localVotes[effectData.id]) {
      setUserVote(localVotes[effectData.id]);
    }

    const handleUpdate = () => {
      // #region agent log
      const startTime = performance.now();
      fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EffectCard.tsx:112',message:'handleUpdate START',data:{effectId:effectData.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
      // #endregion
      const updatedVotes = votesStore.get();
      const newVote = updatedVotes[effectData.id];
      // Оптимизация: обновляем только если значение изменилось
      if (newVote && newVote !== userVote) {
        const stateUpdateStart = performance.now();
        // Используем startTransition для неблокирующего обновления
        startTransition(() => {
          setUserVote(newVote);
        });
        // #region agent log
        const stateUpdateEnd = performance.now();
        fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EffectCard.tsx:115',message:'handleUpdate COMPLETE',data:{totalDuration:stateUpdateEnd-startTime,stateUpdateDuration:stateUpdateEnd-stateUpdateStart,effectId:effectData.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
        // #endregion
      }
    };

    window.addEventListener('votes-updated', handleUpdate);
    return () => window.removeEventListener('votes-updated', handleUpdate);
  }, [effectData.id, userVote]);

  // В превью используем стандартные тексты для вариантов ответа
  const vA = "Как я помню";
  const vB = "Как в реальности";

  const handleVote = async (variant: 'A' | 'B') => {
    // #region agent log
    const startTime = performance.now();
    fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EffectCard.tsx:127',message:'handleVote START',data:{variant,isVoting,userVote,effectId:effectData.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'})}).catch(()=>{});
    // #endregion
    
    if (isVoting || userVote) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EffectCard.tsx:129',message:'handleVote BLOCKED',data:{isVoting,userVote},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    // Проверяем, голосовал ли пользователь за этот эффект ДО установки нового голоса
    const hasVoted = !!votesStore.get()[effectData.id];
    
    // #region agent log
    const stateUpdateStart = performance.now();
    // #endregion
    
    setIsVoting(true);
    setUserVote(variant);
    setVotes(prev => ({ for: variant === 'A' ? prev.for + 1 : prev.for, against: variant === 'B' ? prev.against + 1 : prev.against }));
    
    // #region agent log
    const localStorageStart = performance.now();
    // #endregion
    votesStore.set(effectData.id, variant);
    // #region agent log
    const localStorageEnd = performance.now();
    fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EffectCard.tsx:136',message:'localStorage SET',data:{duration:localStorageEnd-localStorageStart},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion

    // Если пользователь еще не голосовал за этот эффект, обновляем счетчик
    if (!hasVoted) {
      // #region agent log
      const incrementStart = performance.now();
      // #endregion
      incrementVotes();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EffectCard.tsx:140',message:'incrementVotes called',data:{duration:performance.now()-incrementStart},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
    }

    try {
      // #region agent log
      const saveVoteStart = performance.now();
      fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EffectCard.tsx:144',message:'saveVote START',data:{effectId:effectData.id,variant},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      const visitorId = getClientVisitorId(); // ИСПОЛЬЗУЕМ ЕДИНУЮ ФУНКЦИЮ
      const result = await saveVote({ visitorId, effectId: effectData.id, variant });
      
      // #region agent log
      const saveVoteEnd = performance.now();
      fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EffectCard.tsx:146',message:'saveVote COMPLETE',data:{duration:saveVoteEnd-saveVoteStart,success:result.success},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      if (!result.success) { 
        if (result.vote) {
          setUserVote(result.vote.variant as 'A' | 'B');
        } else {
          setUserVote(null); 
          setVotes({ for: effectData.votesFor, against: effectData.votesAgainst }); 
          toast.error('Ошибка'); 
        }
      } else { 
        toast.success('Голос записан');
        if (result.effect) {
          setVotes({ for: result.effect.votesFor, against: result.effect.votesAgainst });
        }
      }
    } catch (error) { 
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EffectCard.tsx:160',message:'handleVote ERROR',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      setUserVote(null);
      setVotes({ for: effectData.votesFor, against: effectData.votesAgainst });
      toast.error('Ошибка');
    } finally { 
      // #region agent log
      const totalDuration = performance.now() - startTime;
      fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EffectCard.tsx:164',message:'handleVote FINALLY',data:{totalDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'})}).catch(()=>{});
      // #endregion
      setIsVoting(false); 
    }
  };

  const safeImageUrl = effectData.imageUrl ? effectData.imageUrl.replace(/'/g, '%27') : null;

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group relative bg-darkCard border border-light/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] flex flex-col h-full ${props.className || ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Контейнер картинки */}
      <div className={`block relative aspect-video overflow-hidden shrink-0 glitch-wrapper ${isUpsideDown ? 'glitch-mirror' : ''}`}>
        <Link href={`/effect/${effectData.id}`} className="absolute inset-0 z-0">
          {effectData.imageUrl ? (
            <>
              <ImageWithSkeleton src={effectData.imageUrl} alt={effectData.title} fill className={`object-cover transition-transform duration-700 ${isHovered ? 'scale-105' : 'scale-100'} relative z-[1]`} priority={props.priority} />
              <div className={`absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent opacity-60 z-[1]`} />
              
              {/* ГЛИТЧ СЛОИ: Рендерим всегда, стиль меняется через CSS класс родителя */}
              {safeImageUrl && (
                <div className="glitch-layers absolute inset-0 z-[2] opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
                  <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
                  <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
                </div>
              )}
            </>
          ) : <div className="w-full h-full bg-white/5 flex items-center justify-center"><span className="text-4xl">👾</span></div>}
        </Link>

        {/* INLINE SHARE OVERLAY */}
        <AnimatePresence>
          {isShareOpen && (
            <m.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="absolute inset-0 z-30 bg-dark/80 flex flex-col items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex gap-3 mb-4">
                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/effect/${effectData.id}` : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform bg-blue-500"
                >
                  <Send className="w-5 h-5" />
                </a>
                {/* VK */}
                <a
                  href={`https://vk.com/share.php?url=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/effect/${effectData.id}` : '')}&title=${encodeURIComponent(effectData.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform bg-blue-600"
                >
                  <VKIcon className="w-5 h-5" />
                </a>
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/effect/${effectData.id}` : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform bg-green-500"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                </a>
                {/* Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(effectData.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/effect/${effectData.id}` : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform bg-sky-500"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
              
              <div className="flex items-center gap-2 w-full max-w-[240px] bg-black/40 border border-white/10 rounded-lg p-1 pl-3">
                <input 
                  type="text" 
                  readOnly 
                  value={typeof window !== 'undefined' ? `${window.location.origin}/effect/${effectData.id}` : ''} 
                  className="bg-transparent text-xs text-light/80 w-full outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/effect/${effectData.id}`);
                    setCopied(true);
                    toast.success('Скопировано');
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`p-1.5 rounded-md transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 hover:bg-white/20 text-light'}`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button 
                onClick={() => setIsShareOpen(false)}
                className="absolute top-2 right-2 p-1.5 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </m.div>
          )}
        </AnimatePresence>

        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md backdrop-blur-md border border-white/10 ${categoryInfo.color} bg-opacity-20 text-xs font-bold uppercase tracking-wider shadow-lg`}>
            <CategoryIcon className="w-3 h-3" />{props.badge || categoryInfo.name}
          </div>
        </div>
        
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <Link 
            href={`/effect/${effectData.id}#comments`} 
            className={`flex items-center gap-1 px-2 py-1 rounded-md backdrop-blur-md text-xs transition-colors z-20 ${
              props.hasNewComments 
                ? 'bg-primary/30 text-primary border border-primary/50 hover:bg-primary/40' 
                : 'bg-black/40 text-white/70 hover:text-white hover:bg-black/60'
            }`}
          >
            <MessageSquare className="w-3 h-3" />{commentsCount}
          </Link>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/40 backdrop-blur-md text-xs text-white/70 pointer-events-none">
            <Eye className="w-3 h-3" />{effectData.views}
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 relative">
        {/* Кнопка "Поделиться" в правом верхнем углу */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsShareOpen(!isShareOpen); // Toggle
          }}
          className={`absolute top-4 right-4 z-10 flex items-center justify-center w-6 h-6 transition-colors ${isShareOpen ? 'text-white' : 'text-white/70 hover:text-white'}`}
          title="Поделиться"
        >
          <Share2 className="w-4 h-4" />
        </button>
        
        {/* Заголовок */}
        <Link href={`/effect/${effectData.id}`} className="block group-hover:text-primary transition-colors mb-3">
          <h3 className="text-xl font-black text-white line-clamp-1 leading-tight">{effectData.title}</h3>
        </Link>
        
        {/* Вопрос */}
        <p className="text-sm text-gray-200 font-medium leading-relaxed line-clamp-2 mb-4">
          {effectData.description}
        </p>

        <div className="mt-auto">
          <StrangerVote 
            variantA={vA} 
            variantB={vB} 
            votesFor={votes.for} 
            votesAgainst={votes.against} 
            userVote={userVote} 
            onVote={handleVote} 
            isVoting={isVoting} 
            onOpenCard={() => router.push(`/effect/${effectData.id}`)}
            openOnClick 
          />
        </div>
      </div>
    </m.div>
  );
}
