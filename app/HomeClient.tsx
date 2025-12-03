'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import EffectCard from '@/components/EffectCard';
import { votesStore } from '@/lib/votes-store';
import { redirectToRandomEffect } from '@/app/actions/effects';
import { useCountUp } from '@/lib/hooks/useCountUp';
import { 
  Sparkles, ArrowRight, Activity, Search, Shuffle, 
  BrainCircuit, Database, Flame, AlertTriangle, Info,
  CheckCircle2, TrendingUp, Sparkles as SparklesIcon,
  Brain, Users, Zap
} from 'lucide-react';
import { EffectCardSkeleton } from '@/components/EmptyState';

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
}

export default function HomeClient({ 
  initialEffects = [], 
  trendingEffects = [], // <--- Теперь используем это
  newEffects = [],      // <--- И это
  topCategories = [],
  globalStats = { totalEffects: 0, totalVotes: 0, totalParticipants: 0 }
}: HomeClientProps) {
  const [voteCount, setVoteCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [votedEffectIds, setVotedEffectIds] = useState<string[]>([]);

  // УДАЛЕНО: const trendingEffects = useMemo(...) - больше не нужно нарезать на клиенте

  const countEffects = useCountUp(globalStats.totalEffects, 1000, mounted);
  const countParticipants = useCountUp(globalStats.totalParticipants, 1000, mounted);
  const countVotes = useCountUp(globalStats.totalVotes, 1000, mounted);

  useEffect(() => {
    setMounted(true);
    const updateVotes = () => {
      const votes = votesStore.get();
      setVoteCount(Object.keys(votes).length);
      setVotedEffectIds(Object.keys(votes));
    };
    updateVotes();
    window.addEventListener('votes-updated', updateVotes);
    return () => window.removeEventListener('votes-updated', updateVotes);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-dark" />;

  return (
    <div className="min-h-screen bg-dark relative font-sans text-light overflow-hidden">
      
      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] opacity-50" />
      </div>

      {/* === ПЕРВЫЙ ЭКРАН (min-h-screen) === */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 min-h-screen flex flex-col justify-center pt-32 pb-20 gap-12">
        
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

        {/* 3. TRENDING */}
        <section>
            <div className="flex items-end justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Flame className="w-6 h-6 text-orange-500" /> В тренде</h2>
                <Link href="/catalog?sort=popular" className="hidden md:flex text-xs font-bold text-light/40 hover:text-white transition-colors items-center gap-1">ПОКАЗАТЬ ВСЕ <ArrowRight className="w-3 h-3" /></Link>
            </div>
            {trendingEffects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingEffects.map((effect, i) => (
                        <EffectCard key={effect.id} {...effect} badge={`#${i + 1}`} priority={i < 3} hasVoted={votedEffectIds.includes(effect.id)} showProgress={votedEffectIds.includes(effect.id)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border border-dashed border-light/10 rounded-2xl bg-white/5"><p className="text-light/40">Данные загружаются или отсутствуют...</p></div>
            )}
        </section>
      </div>

      {/* === ВТОРОЙ ЭКРАН (Скролл) === */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-20 space-y-20">
        
        {/* 4. NEW DISCOVERIES */}
        <section className="pt-12 border-t border-light/5">
             <div className="flex items-center justify-center mb-10">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2"><SparklesIcon className="w-6 h-6 text-yellow-400" /> Новые обнаружения</h2>
             </div>
             {newEffects.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {newEffects.map((effect) => (
                        <EffectCard key={effect.id} {...effect} badge="Новое" hasVoted={votedEffectIds.includes(effect.id)} />
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
