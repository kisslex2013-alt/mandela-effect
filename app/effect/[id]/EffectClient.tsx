'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { m, AnimatePresence } from 'framer-motion';
import { saveVote } from '@/app/actions/votes';
import { getAllEffectIds, getRelatedEffects } from '@/app/actions/effects';
import { votesStore } from '@/lib/votes-store';
import { getClientVisitorId } from '@/lib/client-visitor';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import ArchiveAnomalies from '@/components/comments/ArchiveAnomalies';
import toast from 'react-hot-toast';
import { useReality } from '@/lib/context/RealityContext';
import { Lock, ChevronDown, ChevronUp } from 'lucide-react';
import RealitySwitch from '@/components/ui/RealitySwitch';
import CipherReveal from '@/components/ui/CipherReveal';
import RedactedText from '@/components/ui/RedactedText';

// --- ИКОНКИ ---
const ArrowLeftIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>);
const ArrowRightIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>);
const ShuffleIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>);
const EyeIcon = () => (<svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const SearchIcon = () => (<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
const ScrollTextIcon = () => (<svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);
const BrainIcon = () => (<svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>);
const ExternalLinkIcon = () => (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>);
const InfoIcon = () => (<svg className="w-4 h-4 text-light/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);

interface Effect {
  id: string;
  title: string;
  description: string;
  content: string;
  currentState: string | null;
  category: string;
  imageUrl: string | null;
  votesFor: number;
  votesAgainst: number;
  views: number;
  residue: string | null;
  residueSource?: string | null;
  history: string | null;
  historySource?: string | null;
  interpretations: Record<string, string> | null;
  sourceLink?: string | null;
  scientificSource?: string | null;
  communitySource?: string | null;
}

interface EffectClientProps {
  effect: Effect;
}

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

// Компонент заглушки (Единый блок)
const LockedContent = ({ title, description, showSwitch = false, effectId }: { title: string, description: string, showSwitch?: boolean, effectId?: string }) => {
  const { isUpsideDown } = useReality();
  const systemMessage = generateSystemMessage(effectId || 'default');
  const displayDescription = description || systemMessage;
  const isSystemMessage = !description;

  return (
    <div className="relative bg-darkCard/50 border border-white/10 rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[180px] mt-4 group overflow-hidden">
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
                        {displayDescription}
                    </p>
                    
                    {/* Подсказка показывается всегда, независимо от isSystemMessage */}
                    <div className="text-[10px] text-green-500/60 mt-2 font-mono uppercase tracking-widest animate-pulse">
                        {!isUpsideDown ? (
                            <>
                                &gt;&gt;&gt; ТРЕБУЕТСЯ ПЕРЕХОД <span className="text-stranger-red font-bold drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">В ИЗНАНКУ</span>
                            </>
                        ) : (
                            ">>> НЕОБХОДИМО ЗАФИКСИРОВАТЬ НАБЛЮДЕНИЕ (ГОЛОС)"
                        )}
                    </div>
                </div>

                {showSwitch && (
                    <div className="bg-white/5 p-2 flex justify-center items-center relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-900/10 pointer-events-none" />
                        <div className="relative z-50 scale-90 transform transition-transform hover:scale-100 pointer-events-auto cursor-pointer">
                            <RealitySwitch />
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default function EffectClient({ effect: initialEffect }: EffectClientProps) {
  const router = useRouter();
  
  // Получаем контекст
  const { isUpsideDown, incrementVotes } = useReality();

  const [effect, setEffect] = useState(initialEffect);
  const [userVote, setUserVote] = useState<'A' | 'B' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [glitchTrigger, setGlitchTrigger] = useState(0);
  
  const [allIds, setAllIds] = useState<string[]>([]);
  const [relatedEffects, setRelatedEffects] = useState<any[]>([]);
  const [nextUnvotedId, setNextUnvotedId] = useState<string | null>(null);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [hasUnvoted, setHasUnvoted] = useState(true);
  
  // Состояние для взаимоисключающих аккордеонов (Остатки, История, Теории)
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  
  // Состояния для независимых аккордеонов (Факты, Комментарии)
  const [isFactsOpen, setIsFactsOpen] = useState<boolean>(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);

  // Функция для переключения взаимоисключающих аккордеонов
  const handleExclusiveAccordionToggle = useCallback((id: string) => {
    setOpenAccordion(current => current === id ? null : id);
  }, []);

  const contentLines = effect.content.split('\n');
  const variantA = contentLines.find(l => l.startsWith('Вариант А:'))?.replace('Вариант А: ', '') || 'Вариант А';
  const variantB = contentLines.find(l => l.startsWith('Вариант Б:'))?.replace('Вариант Б: ', '') || 'Вариант Б';

  const interp = effect.interpretations || {};
  const scientificText = interp.scientific || "";
  const scientificLink = interp.scientificSource || effect.scientificSource || effect.sourceLink || "";
  const communityText = interp.community || "";
  const communityLink = interp.communitySource || effect.communitySource || "";

  useEffect(() => {
    const initData = async () => {
      const votes = votesStore.get();
      if (votes[effect.id]) {
        setUserVote(votes[effect.id]);
      }

      const idsRes = await getAllEffectIds();
      if (idsRes.success && idsRes.data) {
        const ids = idsRes.data.map(item => item.id);
        setAllIds(ids);
        calculateNavigation(ids, votes);
      }

      const relatedRes = await getRelatedEffects(effect.category, effect.id);
      if (relatedRes.success && relatedRes.data) {
        setRelatedEffects(relatedRes.data);
      }
    };

    initData();

    const handleVotesUpdate = () => {
      const votes = votesStore.get();
      calculateNavigation(allIds, votes);
    };
    window.addEventListener('votes-updated', handleVotesUpdate);
    return () => window.removeEventListener('votes-updated', handleVotesUpdate);
  }, [effect.id]);

  // Синхронизация состояния аккордеонов при переключении режима
  useEffect(() => {
    if (!isUpsideDown) {
      setOpenAccordion(null);
      setIsFactsOpen(false);
      setIsCommentsOpen(false);
    } else {
      setOpenAccordion(null);
    }
  }, [isUpsideDown]);

  const calculateNavigation = (ids: string[], votes: Record<string, 'A' | 'B'>) => {
    if (ids.length === 0) return;
    const currentIndex = ids.indexOf(effect.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : ids.length - 1;
    setPrevId(ids[prevIndex]);

    const unvotedIds = ids.filter(id => !votes[id] && id !== effect.id);
    setHasUnvoted(unvotedIds.length > 0);

    if (unvotedIds.length > 0) {
        let nextUnvoted = ids.slice(currentIndex + 1).find(id => !votes[id]);
        if (!nextUnvoted) nextUnvoted = ids.slice(0, currentIndex).find(id => !votes[id]);
        setNextUnvotedId(nextUnvoted || null);
    } else {
        setNextUnvotedId(null);
    }
  };

  const handleNextUnvoted = () => {
    if (!nextUnvotedId) {
        toast.success('Вы прошли все эффекты! 🏆');
        return;
    }
    router.push(`/effect/${nextUnvotedId}`);
  };

  const handleRandomUnvoted = () => {
    const votes = votesStore.get();
    const unvotedIds = allIds.filter(id => !votes[id] && id !== effect.id);
    if (unvotedIds.length === 0) {
      toast.success('Поздравляем! Вы прошли все эффекты! 🎉');
      return;
    }
    const randomId = unvotedIds[Math.floor(Math.random() * unvotedIds.length)];
    router.push(`/effect/${randomId}`);
  };

  const handleVote = async (variant: 'A' | 'B') => {
    if (isVoting || userVote) return;
    
    const hasVoted = !!votesStore.get()[effect.id];
    
    setIsVoting(true);
    setGlitchTrigger(prev => prev + 1);

    try {
      setUserVote(variant);
      votesStore.set(effect.id, variant);
      
      if (!hasVoted) {
        incrementVotes();
      }

      setEffect(prev => ({
        ...prev,
        votesFor: variant === 'A' ? prev.votesFor + 1 : prev.votesFor,
        votesAgainst: variant === 'B' ? prev.votesAgainst + 1 : prev.votesAgainst
      }));

      const visitorId = getClientVisitorId();
      if (visitorId) {
        await saveVote({
        visitorId,
        effectId: effect.id,
          variant
        });
      }
      
      toast.success('Зафиксировано');
      calculateNavigation(allIds, { ...votesStore.get(), [effect.id]: variant });

    } catch (error) {
      toast.error('Ошибка при голосовании');
      setUserVote(null);
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = effect.votesFor + effect.votesAgainst;
  const percentA = totalVotes > 0 ? Math.round((effect.votesFor / totalVotes) * 100) : 0;
  const percentB = totalVotes > 0 ? 100 - percentA : 0;
  
  const majorityVariant = percentA >= percentB ? 'A' : 'B';
  const isMajority = userVote === majorityVariant;
  
  const safeImageUrl = effect.imageUrl ? effect.imageUrl.replace(/'/g, '%27') : null;

  return (
    <div className="min-h-screen bg-dark pb-20 pt-32">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Левая колонка */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-8">
                {/* Картинка */}
                <div className={`relative aspect-video rounded-2xl overflow-hidden border border-light/10 shadow-2xl bg-darkCard group w-full mb-6 ${userVote ? 'force-active' : ''}`}>
                    {effect.imageUrl && safeImageUrl ? (
                        <div className={`glitch-wrapper w-full h-full relative ${isUpsideDown ? 'glitch-mirror' : ''}`}>
                            <ImageWithSkeleton src={effect.imageUrl} alt={effect.title} fill className="object-cover relative z-[1]" priority />
                            {/* ГЛИТЧ СЛОИ: ПОКАЗЫВАЕМ ТОЛЬКО В ИЗНАНКЕ */}
                            {isUpsideDown && (
                                <div className="glitch-layers absolute inset-0 z-[2] opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
                                    <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
                                    <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10"><span className="text-6xl">🖼️</span></div>
                    )}
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">{effect.category}</div>
                </div>

                {/* Навигация */}
                <div className="bg-darkCard border border-light/10 rounded-xl p-2 flex items-center justify-between gap-2 shadow-lg mb-8">
                    <Link href={prevId ? `/effect/${prevId}` : '#'} className={`flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${!prevId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <ArrowLeftIcon /> <span className="hidden sm:inline">Предыдущий</span>
                    </Link>
                    <button onClick={handleRandomUnvoted} disabled={!hasUnvoted} className={`flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${!hasUnvoted ? 'opacity-50 cursor-not-allowed grayscale' : ''}`} title={!hasUnvoted ? "Вы прошли все эффекты!" : "Случайный непройденный"} onMouseEnter={() => { if (!hasUnvoted) toast('Вы прошли все доступные эффекты!', { icon: '🎉' }); }}>
                        <ShuffleIcon /> <span className="hidden sm:inline">Случайный</span>
                    </button>
                    <button onClick={handleNextUnvoted} disabled={!nextUnvotedId} className={`flex-1 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 ${!nextUnvotedId ? 'opacity-50 cursor-not-allowed grayscale shadow-none' : ''}`} title={!nextUnvotedId ? "Вы прошли все эффекты!" : "Следующий непройденный"} onMouseEnter={() => { if (!nextUnvotedId) toast('Вы прошли все доступные эффекты!', { icon: '🎉' }); }}>
                        <span className="hidden sm:inline">Следующий</span> <ArrowRightIcon />
                    </button>
                </div>

                {/* ПОХОЖИЕ ЭФФЕКТЫ (Только Desktop) */}
                <div className="hidden lg:block pt-4 border-t border-light/5">
                    <div className="text-xs font-bold text-light/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                        Похожие сбои
                    </div>
                    {relatedEffects.length > 0 && (
                        <m.div layout className="grid grid-cols-2 gap-4">
                            <AnimatePresence mode="popLayout">
                                {relatedEffects.map((relItem, index) => (
                                    <m.div
                                        key={relItem.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                    >
                                        <Link href={`/effect/${relItem.id}`} className="group/card block bg-darkCard border border-light/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
                                            <div className="relative aspect-video bg-black/20">
                                                {relItem.imageUrl && (
                                                    <ImageWithSkeleton src={relItem.imageUrl} alt={relItem.title} fill className="object-cover opacity-80 group-hover/card:opacity-100 transition-opacity" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                                <div className="absolute bottom-2 left-2 right-2">
                                                    <div className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover/card:text-primary transition-colors">{relItem.title}</div>
                                                </div>
                                            </div>
                                        </Link>
                                    </m.div>
                                ))}
                            </AnimatePresence>
                        </m.div>
                    )}
                </div>
            </div>
          </div>

          {/* Правая колонка */}
          <div className="space-y-8">
            
            {/* Заголовок */}
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                <CipherReveal text={effect.title} reveal={true} />
              </h1>
              <p className="text-lg text-light/80 leading-relaxed">
                {effect.description} 
                <span className="ml-2">
                  <RedactedText text="[ДАННЫЕ УДАЛЕНЫ]" />
                </span>
              </p>
            </div>

            {/* Блок Голосования */}
            <m.div 
                key={glitchTrigger}
                animate={glitchTrigger > 0 ? { 
                  x: [0, -5, 5, -2, 2, 0],
                  filter: [
                    "drop-shadow(0 0 0px rgba(59, 130, 246, 0))",
                    "drop-shadow(2px 0 2px rgba(59, 130, 246, 0.8)) drop-shadow(-2px 0 2px rgba(245, 158, 11, 0.8))",
                    "drop-shadow(-2px 0 2px rgba(59, 130, 246, 0.8)) drop-shadow(2px 0 2px rgba(245, 158, 11, 0.8))",
                    "drop-shadow(2px 0 2px rgba(59, 130, 246, 0.8)) drop-shadow(-2px 0 2px rgba(245, 158, 11, 0.8))",
                    "drop-shadow(0 0 0px rgba(59, 130, 246, 0))"
                  ]
                } : {}}
                transition={{ duration: 0.3 }}
            >
                {!userVote ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                          onClick={() => handleVote('A')} 
                          className="group relative overflow-hidden p-6 rounded-2xl bg-darkCard border border-light/10 transition-all hover:shadow-lg text-left h-full vote-button-a"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'var(--vote-a-bg)', color: 'var(--vote-a-text)' }}>A</div>
                            </div>
                            <div className="text-lg font-bold text-light transition-colors line-clamp-4 vote-button-a-text">{variantA}</div>
                        </button>

                        <button 
                          onClick={() => handleVote('B')} 
                          className="group relative overflow-hidden p-6 rounded-2xl bg-darkCard border border-light/10 transition-all hover:shadow-lg text-left h-full vote-button-b"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'var(--vote-b-bg)', color: 'var(--vote-b-text)' }}>B</div>
                            </div>
                            <div className="text-lg font-bold text-light transition-colors line-clamp-4 vote-button-b-text">{variantB}</div>
                        </button>
                    </div>
                ) : (
                    // Результаты
                    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-darkCard border border-light/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative z-10">
                            {/* Вариант А */}
                            <div className={`p-4 rounded-xl border-2 relative overflow-hidden transition-colors duration-500 ${userVote === 'A' ? 'border-[var(--vote-a-bg)] bg-[var(--vote-a-bg)]/10' : 'border-white/5 bg-white/5 opacity-80'}`}>
                                {userVote === 'A' && (
                                    <div className={`absolute top-4 right-4 border-2 font-black text-xs px-2 py-1 rotate-12 opacity-80 tracking-widest ${isMajority ? 'border-green-500 text-green-500' : 'border-purple-500 text-purple-500'}`}>
                                        {isMajority ? 'БОЛЬШИНСТВО' : 'УНИКУМ'}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: 'var(--vote-a-bg)' }}>A</div>
                                </div>
                                <div className="text-sm font-medium text-white mb-3 line-clamp-4">{variantA}</div>
                                <div className="relative h-2 bg-dark rounded-full overflow-hidden mb-1">
                                    <m.div initial={{ width: 0 }} animate={{ width: `${percentA}%` }} className="h-full" style={{ backgroundColor: 'var(--vote-a-bg)' }} />
                                </div>
                                <div className="text-right font-black" style={{ color: 'var(--vote-a-text)' }}>{percentA}%</div>
                            </div>

                            {/* Вариант Б */}
                            <div className={`p-4 rounded-xl border-2 relative overflow-hidden transition-colors duration-500 ${userVote === 'B' ? 'border-[var(--vote-b-bg)] bg-[var(--vote-b-bg)]/10' : 'border-white/5 bg-white/5 opacity-80'}`}>
                                {userVote === 'B' && (
                                    <div className={`absolute top-4 right-4 border-2 font-black text-xs px-2 py-1 rotate-12 opacity-80 tracking-widest ${isMajority ? 'border-green-500 text-green-500' : 'border-purple-500 text-purple-500'}`}>
                                        {isMajority ? 'БОЛЬШИНСТВО' : 'УНИКУМ'}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: 'var(--vote-b-bg)' }}>B</div>
                                </div>
                                <div className="text-sm font-medium text-white mb-3 line-clamp-4">{variantB}</div>
                                <div className="relative h-2 bg-dark rounded-full overflow-hidden mb-1">
                                    <m.div initial={{ width: 0 }} animate={{ width: `${percentB}%` }} className="h-full" style={{ backgroundColor: 'var(--vote-b-bg)' }} />
                                </div>
                                <div className="text-right font-black" style={{ color: 'var(--vote-b-text)' }}>{percentB}%</div>
                            </div>
                        </div>

                        {/* Инфо */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 relative z-10">
                            <div className="flex gap-2 items-start">
                                <InfoIcon />
                                <p className="text-xs text-light/60">
                                    Эффект Манделы — это нормально! Нет правильных или неправильных ответов, только разные версии воспоминаний.
                                </p>
                            </div>
                        </div>
                    </m.div>
                )}
            </m.div>

            {/* Секция контента (Аккордеоны и Заглушки) */}
            <m.div layout className="space-y-3 pt-2">
                
                {/* 1. Факты (Видны всегда, если есть контент) - НЕЗАВИСИМЫЙ аккордеон */}
                {(effect.currentState || scientificText) && (
                    <AccordionItem 
                        id="facts"
                        title="Текущее состояние | Факты" 
                        icon={<EyeIcon />} 
                        color="green" 
                        isOpen={isFactsOpen}
                        onToggle={() => setIsFactsOpen(prev => !prev)}
                    >
                        <p>{effect.currentState || scientificText}</p>
                        {scientificLink && (
                            <a href={scientificLink} target="_blank" rel="noopener" className="mt-3 text-xs text-green-400 hover:underline flex items-center gap-1">
                                <ExternalLinkIcon /> Источник / Подтверждение
                            </a>
                        )}
                    </AccordionItem>
                )}

                {/* ЛОГИКА ОТОБРАЖЕНИЯ СКРЫТОГО КОНТЕНТА */}
                <m.div layout className="overflow-hidden">
                    <AnimatePresence mode="wait">
                        {!isUpsideDown ? (
                            // --- РЕЖИМ РЕАЛЬНОСТИ ---
                            // ВСЕГДА показываем только заглушку, независимо от наличия голоса
                            <m.div
                                key="reality-locked"
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                            >
                                <LockedContent 
                                    title="ДОСТУП ЗАПРЕЩЕН"
                                    description=""
                                    showSwitch={true}
                                    effectId={effect.id}
                                />
                            </m.div>
                        ) : (
                            // --- РЕЖИМ ИЗНАНКИ ---
                            userVote ? (
                                // Если проголосовал: Показываем контент
                                <m.div
                                    key="upside-down-content"
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                    className="space-y-3"
                                >
                                    {/* Остатки - ВЗАИМОИСКЛЮЧАЮЩИЙ */}
                                    {effect.residue && (
                                        <AccordionItem 
                                            id="residue"
                                            title="Культурные следы | Остатки" 
                                            icon={<SearchIcon />} 
                                            color="blue"
                                            isOpen={openAccordion === 'residue'}
                                            onToggle={() => handleExclusiveAccordionToggle('residue')}
                                        >
                                            <div className="whitespace-pre-wrap">{effect.residue}</div>
                                            {effect.residueSource && (
                                                <a href={effect.residueSource} target="_blank" rel="noopener" className="mt-3 text-xs text-blue-400 hover:underline flex items-center gap-1">
                                                    <ExternalLinkIcon /> Ссылка на остатки
                                                </a>
                                            )}
                                        </AccordionItem>
                                    )}

                                    {/* История - ВЗАИМОИСКЛЮЧАЮЩИЙ */}
                                    {effect.history && (
                                        <AccordionItem 
                                            id="history"
                                            title="Временная шкала | История" 
                                            icon={<ScrollTextIcon />} 
                                            color="amber"
                                            isOpen={openAccordion === 'history'}
                                            onToggle={() => handleExclusiveAccordionToggle('history')}
                                        >
                                            <div className="whitespace-pre-wrap">{effect.history}</div>
                                            {effect.historySource && (
                                                <a href={effect.historySource} target="_blank" rel="noopener" className="mt-3 text-xs text-amber-400 hover:underline flex items-center gap-1">
                                                    <ExternalLinkIcon /> Источник истории
                                                </a>
                                            )}
                                        </AccordionItem>
                                    )}

                                    {/* Теории - ВЗАИМОИСКЛЮЧАЮЩИЙ */}
                                    {(scientificText || communityText) && (
                                        <AccordionItem 
                                            id="theories"
                                            title="Что об этом говорят | Теории" 
                                            icon={<BrainIcon />} 
                                            color="pink"
                                            isOpen={openAccordion === 'theories'}
                                            onToggle={() => handleExclusiveAccordionToggle('theories')}
                                        >
                                            {scientificText && (
                                                <div className="mb-4 pb-4 border-b border-white/5">
                                                    <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wider mb-2">Научная точка зрения</h4>
                                                    <div className="whitespace-pre-wrap">{scientificText}</div>
                                                </div>
                                            )}
                                            {communityText && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wider mb-2">Теории сообщества</h4>
                                                    <div className="whitespace-pre-wrap">{communityText}</div>
                                                </div>
                                            )}
                                        </AccordionItem>
                                    )}

                                    {/* Архив Аномалий (Комментарии) - НЕЗАВИСИМЫЙ аккордеон */}
                                    <ArchiveAnomalies 
                                        effectId={effect.id} 
                                        isOpen={isCommentsOpen}
                                        onToggle={() => setIsCommentsOpen(prev => !prev)}
                                    />
                                </m.div>
                            ) : (
                                // Если НЕ проголосовал в Изнанке: Заглушка "Голосуй"
                                <m.div
                                    key="upside-down-locked"
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                >
                                    <LockedContent 
                                        title="ПАМЯТЬ НЕ ВЕРИФИЦИРОВАНА"
                                        description=""
                                        showSwitch={false}
                                        effectId={effect.id}
                                    />
                                </m.div>
                            )
                        )}
                    </AnimatePresence>
                </m.div>

            </m.div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Компонент Аккордеона
function AccordionItem({ id, title, icon, color, children, isOpen, onToggle }: any) {
    const colors: any = {
        green: 'border-green-500/20 hover:border-green-500/40',
        blue: 'border-blue-500/20 hover:border-blue-500/40',
        amber: 'border-amber-500/20 hover:border-amber-500/40',
        pink: 'border-pink-500/20 hover:border-pink-500/40',
    };

    return (
        <div className={`bg-darkCard border rounded-xl overflow-hidden transition-colors ${colors[color] || 'border-light/10'}`}>
              <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="font-bold text-light text-sm">{title}</span>
                </div>
                {isOpen ? <ChevronUp /> : <ChevronDown />}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <m.div
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                        <div className="p-4 pt-0 text-sm text-light/70 leading-relaxed border-t border-white/5 mx-4 mt-2 mb-4">
                            {children}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
  );
}
