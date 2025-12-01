'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { saveVote } from '@/app/actions/votes';
import { getAllEffectIds, getRelatedEffects } from '@/app/actions/effects';
import { votesStore } from '@/lib/votes-store';
import { getVisitorId } from '@/lib/visitor';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import toast from 'react-hot-toast';

interface Effect {
  id: string;
  title: string;
  description: string;
  content: string;
  currentState: string | null; // Добавлено
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

// Простые SVG иконки
const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ShuffleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ScrollTextIcon = () => (
  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BrainIcon = () => (
  <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4 text-light/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

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

export default function EffectClient({ effect: initialEffect }: EffectClientProps) {
  const router = useRouter();
  const [effect, setEffect] = useState(initialEffect);
  const [userVote, setUserVote] = useState<'A' | 'B' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [glitchTrigger, setGlitchTrigger] = useState(0); // Триггер для анимации
  
  // Навигация и Похожие
  const [allIds, setAllIds] = useState<string[]>([]);
  const [relatedEffects, setRelatedEffects] = useState<any[]>([]);
  const [nextUnvotedId, setNextUnvotedId] = useState<string | null>(null);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [hasUnvoted, setHasUnvoted] = useState(true);

  // Варианты из контента
  const contentLines = effect.content.split('\n');
  const variantA = contentLines.find(l => l.startsWith('Вариант А:'))?.replace('Вариант А: ', '') || 'Вариант А';
  const variantB = contentLines.find(l => l.startsWith('Вариант Б:'))?.replace('Вариант Б: ', '') || 'Вариант Б';

  // Извлекаем данные из interpretations (поддержка разных структур JSON)
  const interp = effect.interpretations || {};
  const scientificText = interp.scientific || "";
  const scientificLink = interp.scientificSource || effect.scientificSource || effect.sourceLink || "";
  const communityText = interp.community || "";
  const communityLink = interp.communitySource || effect.communitySource || "";

  // Инициализация
  useEffect(() => {
    const initData = async () => {
      const votes = votesStore.get();
      if (votes[effect.id]) {
        setUserVote(votes[effect.id]);
      }

      // 1. Навигация
      const idsRes = await getAllEffectIds();
      if (idsRes.success && idsRes.data) {
        const ids = idsRes.data.map(item => item.id);
        setAllIds(ids);
        calculateNavigation(ids, votes);
      }

      // 2. Похожие эффекты
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect.id]);

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
    setIsVoting(true);
    setGlitchTrigger(prev => prev + 1); // Запуск анимации

    try {
      setUserVote(variant);
      votesStore.set(effect.id, variant);

      setEffect(prev => ({
        ...prev,
        votesFor: variant === 'A' ? prev.votesFor + 1 : prev.votesFor,
        votesAgainst: variant === 'B' ? prev.votesAgainst + 1 : prev.votesAgainst
      }));

      // Запрос на сервер
      const visitorId = getVisitorId();
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

  // Проценты
  const totalVotes = effect.votesFor + effect.votesAgainst;
  const percentA = totalVotes > 0 ? Math.round((effect.votesFor / totalVotes) * 100) : 0;
  const percentB = totalVotes > 0 ? 100 - percentA : 0;
  
  const majorityVariant = percentA >= percentB ? 'A' : 'B';
  const isMajority = userVote === majorityVariant;
  
  const safeImageUrl = effect.imageUrl ? effect.imageUrl.replace(/'/g, '%27') : null;

  return (
    <div className="min-h-screen bg-dark pb-20 pt-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Левая колонка */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-8">
                {/* Картинка */}
                <div className={`relative aspect-video rounded-2xl overflow-hidden border border-light/10 shadow-2xl bg-darkCard group w-full mb-6 ${userVote ? 'force-active' : ''}`}>
                    {effect.imageUrl && safeImageUrl ? (
                        <div className="glitch-wrapper w-full h-full relative">
                            <ImageWithSkeleton src={effect.imageUrl} alt={effect.title} fill className="object-cover relative z-[1]" priority />
                            {/* Слои глитча: показываем при hover ИЛИ если проголосовал */}
                            <div className="glitch-layers absolute inset-0 z-[2]">
                                <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
                                <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
                                <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10"><span className="text-6xl">🖼️</span></div>
                    )}
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">{effect.category}</div>
                </div>

                {/* Навигация */}
                <div className="bg-darkCard border border-light/10 rounded-xl p-2 flex items-center justify-between gap-2 shadow-lg mb-8">
                    <Link href={prevId ? `/effect/${prevId}` : '#'} className={`flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${!prevId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <ArrowLeftIcon /> <span className="hidden sm:inline">Пред.</span>
                    </Link>
                    <button onClick={handleRandomUnvoted} disabled={!hasUnvoted} className={`flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${!hasUnvoted ? 'opacity-50 cursor-not-allowed grayscale' : ''}`} title={!hasUnvoted ? "Вы прошли все эффекты!" : "Случайный непройденный"} onMouseEnter={() => { if (!hasUnvoted) toast('Вы прошли все доступные эффекты!', { icon: '🎉' }); }}>
                        <ShuffleIcon /> <span className="hidden sm:inline">Случайный</span>
                    </button>
                    <button onClick={handleNextUnvoted} disabled={!nextUnvotedId} className={`flex-1 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 ${!nextUnvotedId ? 'opacity-50 cursor-not-allowed grayscale shadow-none' : ''}`} title={!nextUnvotedId ? "Вы прошли все эффекты!" : "Следующий непройденный"} onMouseEnter={() => { if (!nextUnvotedId) toast('Вы прошли все доступные эффекты!', { icon: '🎉' }); }}>
                        <span className="hidden sm:inline">Следующий</span> <ArrowRightIcon />
                    </button>
                </div>

                {/* ПОХОЖИЕ ЭФФЕКТЫ (Только Desktop) */}
                {relatedEffects.length > 0 && (
                    <div className="hidden lg:block pt-4 border-t border-light/5">
                        <div className="text-xs font-bold text-light/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                            Похожие сбои
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {relatedEffects.map((relItem) => (
                                <Link href={`/effect/${relItem.id}`} key={relItem.id} className="group/card block bg-darkCard border border-light/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
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
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>

          {/* Правая колонка */}
          <div className="space-y-8">
            
            {/* Заголовок */}
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">{effect.title}</h1>
              <p className="text-lg text-light/80 leading-relaxed">{effect.description}</p>
            </div>

            {/* Блок Голосования */}
            <motion.div 
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
                        <button onClick={() => handleVote('A')} className="group relative overflow-hidden p-6 rounded-2xl bg-darkCard border border-light/10 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 text-left h-full">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm">A</div>
                            </div>
                            <div className="text-lg font-bold text-light group-hover:text-blue-200 transition-colors line-clamp-4">{variantA}</div>
                        </button>

                        <button onClick={() => handleVote('B')} className="group relative overflow-hidden p-6 rounded-2xl bg-darkCard border border-light/10 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10 text-left h-full">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-sm">B</div>
                            </div>
                            <div className="text-lg font-bold text-light group-hover:text-amber-200 transition-colors line-clamp-4">{variantB}</div>
                        </button>
                    </div>
                ) : (
                    // Результаты
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-darkCard border border-light/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative z-10">
                            {/* Вариант А */}
                            <div className={`p-4 rounded-xl border-2 relative overflow-hidden ${userVote === 'A' ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-white/5 opacity-80'}`}>
                                {userVote === 'A' && (
                                    <div className={`absolute top-4 right-4 border-2 font-black text-xs px-2 py-1 rotate-12 opacity-80 tracking-widest ${isMajority ? 'border-green-500 text-green-500' : 'border-purple-500 text-purple-500'}`}>
                                        {isMajority ? 'БОЛЬШИНСТВО' : 'УНИКУМ'}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">A</div>
                                </div>
                                <div className="text-sm font-medium text-white mb-3 line-clamp-4">{variantA}</div>
                                <div className="relative h-2 bg-dark rounded-full overflow-hidden mb-1">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentA}%` }} className="h-full bg-blue-500" />
                                </div>
                                <div className="text-right font-black text-blue-400">{percentA}%</div>
                            </div>

                            {/* Вариант Б */}
                            <div className={`p-4 rounded-xl border-2 relative overflow-hidden ${userVote === 'B' ? 'border-amber-500 bg-amber-500/5' : 'border-white/5 bg-white/5 opacity-80'}`}>
                                {userVote === 'B' && (
                                    <div className={`absolute top-4 right-4 border-2 font-black text-xs px-2 py-1 rotate-12 opacity-80 tracking-widest ${isMajority ? 'border-green-500 text-green-500' : 'border-purple-500 text-purple-500'}`}>
                                        {isMajority ? 'БОЛЬШИНСТВО' : 'УНИКУМ'}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">B</div>
                                </div>
                                <div className="text-sm font-medium text-white mb-3 line-clamp-4">{variantB}</div>
                                <div className="relative h-2 bg-dark rounded-full overflow-hidden mb-1">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentB}%` }} className="h-full bg-amber-500" />
                                </div>
                                <div className="text-right font-black text-amber-400">{percentB}%</div>
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
                    </motion.div>
                )}
            </motion.div>

            {/* Аккордеоны */}
            <AnimatePresence>
                {userVote && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                        
                        {/* 1. Реальность (Факты) */}
                        {(effect.currentState || scientificText) && (
                            <AccordionItem title="Текущее состояние (Факты)" icon={<EyeIcon />} color="green" defaultOpen={false}>
                                <p>{effect.currentState || scientificText}</p>
                                {scientificLink && (
                                    <a href={scientificLink} target="_blank" rel="noopener" className="mt-3 text-xs text-green-400 hover:underline flex items-center gap-1">
                                        <ExternalLinkIcon /> Источник / Подтверждение
                                    </a>
                                )}
                            </AccordionItem>
                        )}

                        {/* 2. Остатки */}
                        {effect.residue && (
                            <AccordionItem title="Культурные следы (Остатки)" icon={<SearchIcon />} color="blue">
                                <div className="whitespace-pre-wrap">{effect.residue}</div>
                                {effect.residueSource && (
                                    <a href={effect.residueSource} target="_blank" rel="noopener" className="mt-3 text-xs text-blue-400 hover:underline flex items-center gap-1">
                                        <ExternalLinkIcon /> Ссылка на остатки
                                    </a>
                                )}
                            </AccordionItem>
                        )}

                        {/* 3. История */}
                        {effect.history && (
                            <AccordionItem title="Временная шкала (История)" icon={<ScrollTextIcon />} color="amber">
                                <div className="whitespace-pre-wrap">{effect.history}</div>
                                {effect.historySource && (
                                    <a href={effect.historySource} target="_blank" rel="noopener" className="mt-3 text-xs text-amber-400 hover:underline flex items-center gap-1">
                                        <ExternalLinkIcon /> Источник истории
                                    </a>
                                )}
                            </AccordionItem>
                        )}

                        {/* 4. Теории (Разделенный) */}
                        {(scientificText || communityText) && (
                            <AccordionItem title="Что об этом говорят (Теории)" icon={<BrainIcon />} color="pink">
                                {/* Научное объяснение */}
                                {scientificText && (
                                    <div className="mb-4 pb-4 border-b border-white/5">
                                        <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wider mb-2">Научная точка зрения</h4>
                                        <div className="whitespace-pre-wrap">{scientificText}</div>
                                        {scientificLink && (
                                            <a href={scientificLink} target="_blank" rel="noopener" className="mt-2 text-xs text-pink-400 hover:underline flex items-center gap-1">
                                                <ExternalLinkIcon /> Источник
                                            </a>
                                        )}
                                    </div>
                                )}
                                
                                {/* Мнение сообщества */}
                                {communityText && (
                                    <div>
                                        <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wider mb-2">Теории сообщества</h4>
                                        <div className="whitespace-pre-wrap">{communityText}</div>
                                        {communityLink && (
                                            <a href={communityLink} target="_blank" rel="noopener" className="mt-2 text-xs text-pink-400 hover:underline flex items-center gap-1">
                                                <ExternalLinkIcon /> Источник
                                            </a>
                                        )}
                                    </div>
                                )}
                            </AccordionItem>
                        )}

                    </motion.div>
                )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}

// Компонент Аккордеона
function AccordionItem({ title, icon, color, children, defaultOpen = false }: any) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    const colors: any = {
        green: 'border-green-500/20 hover:border-green-500/40',
        blue: 'border-blue-500/20 hover:border-blue-500/40',
        amber: 'border-amber-500/20 hover:border-amber-500/40',
        pink: 'border-pink-500/20 hover:border-pink-500/40',
    };

    return (
        <div className={`bg-darkCard border rounded-xl overflow-hidden transition-colors ${colors[color] || 'border-light/10'}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="font-bold text-light text-sm">{title}</span>
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
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
