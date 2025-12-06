'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, Share2, Eye } from 'lucide-react';
import { saveVote } from '@/app/actions/votes';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import StrangerVote from '@/components/ui/StrangerVote';
import { getCategoryInfo } from '@/lib/constants';
import { votesStore } from '@/lib/votes-store';
import toast from 'react-hot-toast';

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
  };
  // Пропсы для обратной совместимости
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

  // Определяем начальное состояние голоса на основе пропсов
  // Если hasVoted=true, но вариант не передан, по умолчанию ставим 'A' (визуально)
  const [userVote, setUserVote] = useState<'A' | 'B' | null>(
    props.initialUserVote || (props.hasVoted ? 'A' : null)
  );
  
  const [votes, setVotes] = useState({ 
    for: effectData.votesFor, 
    against: effectData.votesAgainst 
  });
  const [isVoting, setIsVoting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const categoryInfo = getCategoryInfo(effectData.category);
  const CategoryIcon = categoryInfo.icon;

  // СИНХРОНИЗАЦИЯ С LOCALSTORAGE (Мгновенная реакция)
  useEffect(() => {
    const localVotes = votesStore.get();
    if (localVotes[effectData.id]) {
      setUserVote(localVotes[effectData.id]);
    }

    const handleUpdate = () => {
      const updatedVotes = votesStore.get();
      if (updatedVotes[effectData.id]) {
        setUserVote(updatedVotes[effectData.id]);
      }
    };

    window.addEventListener('votes-updated', handleUpdate);
    return () => window.removeEventListener('votes-updated', handleUpdate);
  }, [effectData.id]);

  const parseVariants = () => {
    let vA = "Как я помню";
    let vB = "Как в реальности";
    if (effectData.content) {
      const matchA = effectData.content.match(/Вариант А:\s*(.*?)(?:\n|$)/);
      const matchB = effectData.content.match(/Вариант Б:\s*(.*?)(?:\n|$)/);
      if (matchA && matchA[1]) vA = matchA[1].trim();
      if (matchB && matchB[1]) vB = matchB[1].trim();
    }
    return { vA, vB };
  };

  const { vA, vB } = parseVariants();

  const handleVote = async (variant: 'A' | 'B') => {
    if (isVoting || userVote) return;
    setIsVoting(true);
    setUserVote(variant);
    setVotes(prev => ({ for: variant === 'A' ? prev.for + 1 : prev.for, against: variant === 'B' ? prev.against + 1 : prev.against }));
    // Сохраняем локально сразу
    votesStore.set(effectData.id, variant);

    try {
      let visitorId = localStorage.getItem('visitorId');
      if (!visitorId) { visitorId = crypto.randomUUID(); localStorage.setItem('visitorId', visitorId); }
      const result = await saveVote({ visitorId, effectId: effectData.id, variant });
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
      setUserVote(null);
      setVotes({ for: effectData.votesFor, against: effectData.votesAgainst });
      toast.error('Ошибка');
    } finally { setIsVoting(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group relative bg-darkCard border border-light/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] flex flex-col h-full ${props.className || ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Контейнер картинки */}
      <div className="block relative aspect-video overflow-hidden shrink-0 glitch-wrapper">
        <Link href={`/effect/${effectData.id}`} className="absolute inset-0 z-0">
          {effectData.imageUrl ? (
            <>
              <ImageWithSkeleton src={effectData.imageUrl} alt={effectData.title} fill className={`object-cover transition-transform duration-700 ${isHovered ? 'scale-105' : 'scale-100'} relative z-[1]`} priority={props.priority} />
              <div className={`absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent opacity-60 z-[1]`} />
              {/* GLITCH LAYERS (Complex Glitch Effect) */}
              <div className="glitch-layers absolute inset-0 z-[2] opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="glitch-layer" style={{ backgroundImage: `url('${effectData.imageUrl.replace(/'/g, '%27')}')` }} />
                <div className="glitch-layer" style={{ backgroundImage: `url('${effectData.imageUrl.replace(/'/g, '%27')}')` }} />
                <div className="glitch-layer" style={{ backgroundImage: `url('${effectData.imageUrl.replace(/'/g, '%27')}')` }} />
              </div>
            </>
          ) : <div className="w-full h-full bg-white/5 flex items-center justify-center"><span className="text-4xl">👾</span></div>}
        </Link>

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
                : 'bg-black/40 text-white/70 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3 h-3" />{effectData._count?.comments || 0}
          </Link>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/40 backdrop-blur-md text-xs text-white/70 pointer-events-none">
            <Eye className="w-3 h-3" />{effectData.views}
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 relative">
        <div className="flex items-center justify-between mb-2">
          <Link href={`/effect/${effectData.id}`} className="block group-hover:text-primary transition-colors flex-1">
            <h3 className="text-xl font-bold text-white line-clamp-1 leading-tight">{effectData.title}</h3>
          </Link>
          <button className="flex items-center gap-1.5 hover:text-primary transition-colors text-xs text-light/40 ml-4" title="Поделиться">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-light/60 mb-6 line-clamp-2 h-10 leading-relaxed">{effectData.description}</p>
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
    </motion.div>
  );
}
