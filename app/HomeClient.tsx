'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import EffectCard from '@/components/EffectCard';
import { votesStore } from '@/lib/votes-store';
import { redirectToRandomEffect, getEffectById } from '@/app/actions/effects';
import { useCountUp } from '@/lib/hooks/useCountUp';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import { getReadCommentsData } from '@/lib/comments-tracker';
import { 
  Sparkles, ArrowRight, Activity, Search, Shuffle, 
  BrainCircuit, Database, Flame, AlertTriangle, Info,
  CheckCircle2, TrendingUp, Sparkles as SparklesIcon,
  Brain, Users, Zap, CalendarClock, ArrowUpRight, Radar,
  Film, Music, Tag, User, Globe, Gamepad2, Baby, Ghost
} from 'lucide-react';
import { CATEGORY_MAP } from '@/lib/constants';

interface HomeClientProps {
  initialEffects?: any[]; // Оставляем для обратной совместимости
  trendingEffects?: any[];
  newEffects?: any[];
  topCategories?: any[];
  globalStats?: {
    totalEffects: number;
    totalVotes: number;
    totalParticipants: number;
  };
  effectOfDay?: EffectOfDay | null;
}

type EffectOfDay = {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string | null;
  votesFor: number;
  votesAgainst: number;
  createdAt: string;
  mandelaPercent: number;
  realityPercent: number;
  totalVotes: number;
  nextReset: string;
};

export default function HomeClient({ 
  initialEffects = [], 
  trendingEffects = [], // <--- Теперь используем это
  newEffects = [],      // <--- И это
  topCategories = [],
  globalStats = { totalEffects: 0, totalVotes: 0, totalParticipants: 0 },
  effectOfDay = null,
}: HomeClientProps) {
  const [voteCount, setVoteCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [votedEffectIds, setVotedEffectIds] = useState<string[]>([]);
  const [shiftCountdown, setShiftCountdown] = useState('--:--:--');
  const [currentEffectOfDay, setCurrentEffectOfDay] = useState<EffectOfDay | null>(effectOfDay);
  const [readCommentsData, setReadCommentsData] = useState<Record<string, { lastReadAt: string; lastCommentCount: number }>>({});

  // УДАЛЕНО: const trendingEffects = useMemo(...) - больше не нужно нарезать на клиенте

  const countEffects = useCountUp(globalStats.totalEffects, 1000, mounted);
  const countParticipants = useCountUp(globalStats.totalParticipants, 1000, mounted);
  const countVotes = useCountUp(globalStats.totalVotes, 1000, mounted);

  useEffect(() => {
    setMounted(true);
    const updateVotes = async () => {
      const votes = votesStore.get();
      setVoteCount(Object.keys(votes).length);
      setVotedEffectIds(Object.keys(votes));
      
      // Обновляем данные эффекта дня, если он был изменен
      if (currentEffectOfDay && votes[currentEffectOfDay.id]) {
        try {
          const updatedEffect = await getEffectById(currentEffectOfDay.id);
          if (updatedEffect) {
            const totalVotes = updatedEffect.votesFor + updatedEffect.votesAgainst;
            const mandelaPercent = totalVotes > 0 ? Math.round((updatedEffect.votesFor / totalVotes) * 100) : 50;
            const realityPercent = 100 - mandelaPercent;
            
            setCurrentEffectOfDay({
              ...currentEffectOfDay,
              votesFor: updatedEffect.votesFor,
              votesAgainst: updatedEffect.votesAgainst,
              mandelaPercent,
              realityPercent,
              totalVotes,
            });
          }
        } catch (error) {
          console.error('Ошибка при обновлении данных эффекта дня:', error);
        }
      }
    };
    const loadReadComments = () => {
      const data = getReadCommentsData();
      setReadCommentsData(data);
    };
    
    updateVotes();
    loadReadComments();
    
    // Слушаем событие обновления прочитанных комментариев для обновления бейджей
    const handleCommentsRead = () => {
      // Обновляем данные о прочитанных комментариях из localStorage
      loadReadComments();
    };
    
    window.addEventListener('votes-updated', updateVotes);
    window.addEventListener('comments-read', handleCommentsRead);
    return () => {
      window.removeEventListener('votes-updated', updateVotes);
      window.removeEventListener('comments-read', handleCommentsRead);
    };
  }, [currentEffectOfDay?.id]);

  useEffect(() => {
    setCurrentEffectOfDay(effectOfDay);
  }, [effectOfDay]);

  useEffect(() => {
    if (!currentEffectOfDay?.nextReset) return;
    const target = new Date(currentEffectOfDay.nextReset).getTime();
    if (Number.isNaN(target)) return;

    const updateCountdown = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setShiftCountdown('00:00:00');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      const format = (num: number) => String(num).padStart(2, '0');
      setShiftCountdown(`${format(hours)}:${format(minutes)}:${format(seconds)}`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [currentEffectOfDay?.nextReset]);

  const shiftLogLabel = useMemo(() => {
    if (!currentEffectOfDay) return '';
    const date = new Date(currentEffectOfDay.createdAt);
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `SHIFT LOG #${String(dayOfYear).padStart(3, '0')}`;
  }, [currentEffectOfDay]);

  const shiftMood = useMemo(() => {
    if (!currentEffectOfDay) return 'Ждём фиксации следующей аномалии';
    if (currentEffectOfDay.mandelaPercent === 50) return 'Критический парадокс 50/50';
    if (currentEffectOfDay.mandelaPercent >= 65) return 'Коллективная память дрейфует';
    if (currentEffectOfDay.mandelaPercent <= 35) return 'Реальность удерживает контроль';
    return 'Наблюдаем мягкий сдвиг';
  }, [currentEffectOfDay]);

  const shiftMoodTone = useMemo(() => {
    if (!currentEffectOfDay) return 'text-light/60';
    if (currentEffectOfDay.mandelaPercent >= 65) return 'text-purple-200';
    if (currentEffectOfDay.mandelaPercent <= 35) return 'text-green-200';
    return 'text-yellow-200';
  }, [currentEffectOfDay]);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'films': return <Film className="w-4 h-4" />;
      case 'music': return <Music className="w-4 h-4" />;
      case 'brands': return <Tag className="w-4 h-4" />;
      case 'people': return <User className="w-4 h-4" />;
      case 'geography': return <Globe className="w-4 h-4" />;
      case 'popculture': return <Gamepad2 className="w-4 h-4" />;
      case 'childhood': return <Baby className="w-4 h-4" />;
      case 'russian': return <Ghost className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  if (!mounted) return <div className="min-h-screen bg-dark" />;

  return (
    <div className="bg-dark relative font-sans text-light">
      
      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] opacity-50" />
      </div>

      {/* === ПЕРВЫЙ ЭКРАН (адаптивная высота, равномерное распределение) === */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 min-h-screen flex flex-col justify-between pt-32 pb-12 gap-8">
        
        {/* 1. HERO & HUD */}
        <div className="text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-5xl md:text-8xl font-black text-white mb-6 leading-tight tracking-tighter glitch-text" data-text="ЭФФЕКТ МАНДЕЛЫ">
              ЭФФЕКТ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">МАНДЕЛЫ</span>
            </h1>
            <p className="text-xl text-light/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              Сбой в матрице или ложная память? Исследуй коллективные заблуждения.
            </p>

            {/* HUD STATS BAR */}
            <div className="w-full max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 bg-white/5 backdrop-blur-md border border-light/10 rounded-2xl mb-12 shadow-2xl divide-x divide-y md:divide-y-0 divide-light/10 overflow-hidden">
                <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2 mb-1 text-primary"><Brain className="w-4 h-4" /><span className="text-xl font-mono font-bold text-white">{countEffects}</span></div>
                    <div className="text-[10px] text-light/40 uppercase font-bold tracking-wider">Эффектов</div>
                </div>
                <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2 mb-1 text-blue-400"><Users className="w-4 h-4" /><span className="text-xl font-mono font-bold text-white">{countParticipants}</span></div>
                    <div className="text-[10px] text-light/40 uppercase font-bold tracking-wider">Участников</div>
                </div>
                <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2 mb-1 text-yellow-400"><Zap className="w-4 h-4" /><span className="text-xl font-mono font-bold text-white">{countVotes}</span></div>
                    <div className="text-[10px] text-light/40 uppercase font-bold tracking-wider">Голосов</div>
                </div>
                <Link href="/my-memory" className="p-4 flex flex-col items-center justify-center group hover:bg-purple-500/10 transition-colors cursor-pointer relative">
                    <div className={`flex items-center gap-2 mb-1 ${voteCount > 0 ? 'text-purple-400' : 'text-light/40'}`}><CheckCircle2 className="w-4 h-4" /><span className="text-xl font-mono font-bold text-white">{voteCount}</span></div>
                    <div className={`text-[10px] uppercase font-bold tracking-wider ${voteCount > 0 ? 'text-purple-400' : 'text-light/40'}`}>Твой вклад</div>
                    {voteCount > 0 && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />}
                </Link>
            </div>

          </motion.div>
        </div>

        {currentEffectOfDay && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative w-full bg-gradient-to-r from-[#1b1030]/90 via-darkCard to-[#071c2a]/70 border border-white/10 rounded-3xl p-6 lg:p-8 shadow-[0_0_80px_rgba(80,34,255,0.25)] overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none opacity-50">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#5b21b6,transparent_55%)] blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(59,130,246,0.15))]" />
            </div>
            <div className="relative grid gap-8 lg:grid-cols-[1.05fr_1fr]">
              <Link
                href={`/effect/${currentEffectOfDay.id}`}
                className="group relative rounded-2xl overflow-hidden border border-white/10 bg-black/30 min-h-[260px] shadow-2xl force-active"
              >
                {currentEffectOfDay.imageUrl ? (
                  <ImageWithSkeleton
                    src={currentEffectOfDay.imageUrl}
                    alt={currentEffectOfDay.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
                    🌀
                  </div>
                )}
                <div className="absolute inset-0 glitch-layers pointer-events-none z-[2]">
                  <div className="glitch-layer" style={{ backgroundImage: currentEffectOfDay.imageUrl ? `url('${currentEffectOfDay.imageUrl}')` : 'none' }} />
                  <div className="glitch-layer" style={{ backgroundImage: currentEffectOfDay.imageUrl ? `url('${currentEffectOfDay.imageUrl}')` : 'none' }} />
                  <div className="glitch-layer" style={{ backgroundImage: currentEffectOfDay.imageUrl ? `url('${currentEffectOfDay.imageUrl}')` : 'none' }} />
                </div>
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 border border-white/10 text-[11px] font-semibold tracking-[0.3em] uppercase text-white/80">
                  <Sparkles className="w-4 h-4 text-purple-300" />
                  Log
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-1 rounded-full border border-white/10 text-xs font-semibold uppercase tracking-widest text-white/80">
                  <span className="text-primary opacity-80">
                    {getCategoryIcon(currentEffectOfDay.category)}
                  </span>
                </div>
              </Link>

              <div className="relative flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                      <Sparkles className="w-4 h-4 text-purple-200" /> Эффект дня
                    </span>
                    {shiftLogLabel && <span className="text-light/40 font-mono text-xs">{shiftLogLabel}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-cyan-200 font-mono">
                    <CalendarClock className="w-4 h-4" />
                    <span>{shiftCountdown}</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">{currentEffectOfDay.title}</h2>
                  <p className="text-light/70 text-base md:text-lg max-w-2xl">
                    {currentEffectOfDay.description}
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-black/30 rounded-2xl border border-white/5 p-4">
                    <div className="text-xs uppercase text-light/40 tracking-[0.3em] mb-2">Мандела</div>
                    <div className="text-3xl font-black text-white">{currentEffectOfDay.mandelaPercent}%</div>
                    <p className="text-xs text-light/50 mt-1">коллективная память</p>
                  </div>
                  <div className="bg-black/30 rounded-2xl border border-white/5 p-4">
                    <div className="text-xs uppercase text-light/40 tracking-[0.3em] mb-2">Реальность</div>
                    <div className="text-3xl font-black text-white">{currentEffectOfDay.realityPercent}%</div>
                    <p className="text-xs text-light/50 mt-1">официальная версия</p>
                  </div>
                  <div className="bg-black/30 rounded-2xl border border-white/5 p-4">
                    <div className="text-xs uppercase text-light/40 tracking-[0.3em] mb-2">голосов</div>
                    <div className="text-3xl font-black text-white">{currentEffectOfDay.totalVotes}</div>
                    <p className={`text-xs mt-1 ${shiftMoodTone}`}>{shiftMood}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] uppercase text-light/40 font-bold tracking-[0.3em]">
                    <span>ложная память</span>
                    <span>реальность</span>
                  </div>
                  <div className="h-3 rounded-full bg-black/40 overflow-hidden flex border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-300"
                      style={{ width: `${currentEffectOfDay.mandelaPercent}%` }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-300"
                      style={{ width: `${currentEffectOfDay.realityPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  <Link
                    href={`/effect/${currentEffectOfDay.id}`}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                  >
                    Исследовать эффект <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-light/60 uppercase tracking-[0.3em]">
                    <Radar className="w-4 h-4 text-cyan-300" />
                    {shiftMood}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* 2. QUICK ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => redirectToRandomEffect()} className="group relative px-4 py-3 bg-darkCard border border-light/10 rounded-xl hover:border-purple-500/50 transition-all overflow-hidden flex items-center gap-3 shadow-lg">
                <div className="absolute top-0 right-0 p-8 bg-purple-500/10 blur-2xl rounded-full -mr-4 -mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-purple-500/20 transition-colors shrink-0"><Shuffle className="w-5 h-5 text-purple-400" /></div>
                <div className="text-left flex-1"><h3 className="font-bold text-white text-sm leading-tight">Случайный сбой</h3><p className="text-[10px] text-light/50">Испытай удачу</p></div>
            </button>
            <Link href="/quiz" className="group relative px-4 py-3 bg-darkCard border border-light/10 rounded-xl hover:border-cyan-500/50 transition-all overflow-hidden flex items-center gap-3 shadow-lg">
                <div className="absolute top-0 right-0 p-8 bg-cyan-500/10 blur-2xl rounded-full -mr-4 -mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-cyan-500/20 transition-colors shrink-0"><BrainCircuit className="w-5 h-5 text-cyan-400" /></div>
                <div className="text-left flex-1"><h3 className="font-bold text-white text-sm leading-tight">Тест памяти</h3><p className="text-[10px] text-light/50">Проверка реальности</p></div>
            </Link>
            <Link href="/catalog" className="group relative px-4 py-3 bg-darkCard border border-light/10 rounded-xl hover:border-green-500/50 transition-all overflow-hidden flex items-center gap-3 shadow-lg">
                <div className="absolute top-0 right-0 p-8 bg-green-500/10 blur-2xl rounded-full -mr-4 -mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-green-500/20 transition-colors shrink-0"><Database className="w-5 h-5 text-green-400" /></div>
                <div className="text-left flex-1"><h3 className="font-bold text-white text-sm leading-tight">Полный архив</h3><p className="text-[10px] text-light/50">Вся база данных</p></div>
            </Link>
        </div>
      </div>

      {/* === ВТОРОЙ ЭКРАН (Скролл) === */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-20 space-y-20 pt-12">
        
        {/* 3. TRENDING */}
        <section>
            <div className="flex items-end justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Flame className="w-6 h-6 text-orange-500" /> В тренде</h2>
                <Link href="/catalog?sort=popular" className="hidden md:flex text-xs font-bold text-light/40 hover:text-white transition-colors items-center gap-1">ПОКАЗАТЬ ВСЕ <ArrowRight className="w-3 h-3" /></Link>
            </div>
            {trendingEffects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingEffects.map((effect, i) => (
                        <EffectCard 
                            key={effect.id} 
                            {...effect} 
                            badge={`#${i + 1}`} 
                            priority={i < 3} 
                            hasVoted={votedEffectIds.includes(effect.id)} 
                            showProgress={votedEffectIds.includes(effect.id)}
                            hasNewComments={mounted && (() => {
                              const readData = readCommentsData[effect.id];
                              const commentCount = effect.commentsCount || 0;
                              if (!readData) {
                                return commentCount > 0;
                              }
                              return commentCount > readData.lastCommentCount;
                            })()}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border border-dashed border-light/10 rounded-2xl bg-white/5"><p className="text-light/40">Данные загружаются или отсутствуют...</p></div>
            )}
        </section>
        
        {/* 4. NEW DISCOVERIES */}
        <section className="pt-12 border-t border-light/5">
             <div className="flex items-center justify-center mb-10">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2"><SparklesIcon className="w-6 h-6 text-yellow-400" /> Новые обнаружения</h2>
             </div>
             {newEffects.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {newEffects.map((effect) => (
                        <EffectCard 
                            key={effect.id} 
                            {...effect} 
                            badge="Новое" 
                            hasVoted={votedEffectIds.includes(effect.id)}
                            hasNewComments={mounted && (() => {
                              const readData = readCommentsData[effect.id];
                              const commentCount = effect.commentsCount || 0;
                              if (!readData) {
                                return commentCount > 0;
                              }
                              return commentCount > readData.lastCommentCount;
                            })()}
                        />
                    ))}
                 </div>
             ) : (
                 <div className="text-center py-12 text-light/30">База данных пуста или недоступна</div>
             )}
             <div className="text-center">
                 <Link href="/catalog?sort=newest" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-light transition-colors text-sm font-medium">Смотреть все поступления <ArrowRight className="w-4 h-4" /></Link>
             </div>
        </section>

        {/* 5. FOOTER INFO */}
        <section className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-4 items-center text-center md:text-left">
                <div className="p-3 bg-yellow-500/10 rounded-full text-yellow-500 shrink-0"><AlertTriangle className="w-6 h-6" /></div>
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Внимание: Зона нестабильности</h3>
                    <p className="text-sm text-light/70">Эффект Манделы — это феномен коллективных ложных воспоминаний. Нет правильных ответов — есть разные восприятия.</p>
                </div>
            </div>
        </section>

      </div>
    </div>
  );
}
