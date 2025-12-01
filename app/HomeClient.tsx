'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCountUp } from '@/lib/hooks/useCountUp';
import { redirectToRandomEffect, getEffects, getStats, getEffectsByIds, type EffectResult } from '@/app/actions/effects';
import { HomeEmptyState, EffectCardSkeleton, ControversialSkeleton } from '@/components/EmptyState';
import EffectCard from '@/components/EffectCard';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import GlitchTitle from '@/components/ui/GlitchTitle';
import { votesStore } from '@/lib/votes-store';
import { 
  Sparkles, Film, Music, Tag, User, Globe, Gamepad2, Baby, 
  Ghost, HelpCircle, ArrowRight, TrendingUp, Activity, Search,
  Brain, Users, MessageSquare, CheckCircle, Users2, Sparkles as SparklesIcon, Star, AlertTriangle, Info
} from 'lucide-react';

interface MostControversialEffect extends EffectResult {
  controversy: number;
  percentA: number;
  percentB: number;
  totalVotes: number;
}

export default function HomeClient() {
  const getCategoryIcon = (slug: string, className = "w-5 h-5") => {
    switch (slug) {
      case 'films': return <Film className={className} />;
      case 'music': return <Music className={className} />;
      case 'brands': return <Tag className={className} />;
      case 'people': return <User className={className} />;
      case 'geography': return <Globe className={className} />;
      case 'popculture': return <Gamepad2 className={className} />;
      case 'childhood': return <Baby className={className} />;
      case 'russian': return <Ghost className={className} />;
      default: return <HelpCircle className={className} />;
    }
  };

  const [stats, setStats] = useState({ totalEffects: 0, totalVotes: 0, totalViews: 0, totalParticipants: 0 });
  const [popularEffects, setPopularEffects] = useState<EffectResult[]>([]);
  const [newEffects, setNewEffects] = useState<EffectResult[]>([]);
  const [mostControversial, setMostControversial] = useState<MostControversialEffect | null>(null);
  const [loading, setLoading] = useState(true);
  const [votedEffectIds, setVotedEffectIds] = useState<string[]>([]);
  const [userStats, setUserStats] = useState({ voted: 0, inMajority: 0, inMinority: 0, uniqueMemory: 0 });
  const [voteCount, setVoteCount] = useState(0);

  // Загрузка голосов
  const loadVotes = async () => {
    const { getVisitorId } = await import('@/lib/visitor');
    const { getUserVotes } = await import('@/app/actions/votes');
    
    const visitorId = getVisitorId();
    const votedIds: string[] = [];

    if (visitorId) {
      try {
        const serverVotes = await getUserVotes(visitorId);
        serverVotes.votes.forEach((vote) => votedIds.push(vote.effectId));
      } catch (error) {
        console.error('Ошибка загрузки голосов из БД:', error);
      }
    }

    if (typeof window !== 'undefined') {
      const storeVotes = votesStore.get();
      Object.keys(storeVotes).forEach(id => {
        if (!votedIds.includes(id)) votedIds.push(id);
      });
    }

    return votedIds;
  };

  // Инициализация данных
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [popularData, newData, statsData, votedIds] = await Promise.all([
          getEffects({ sort: 'popular', limit: 3 }),
          getEffects({ sort: 'newest', limit: 6 }),
          getStats(),
          loadVotes(),
        ]);

        setPopularEffects(popularData);
        setNewEffects(newData);
        setStats(statsData);
        setVotedEffectIds(votedIds);

        const allEffects = await getEffects({ limit: 50 });
        const controversial = allEffects
          .filter(e => (e.votesFor + e.votesAgainst) > 0)
          .map(e => {
            const total = e.votesFor + e.votesAgainst;
            const percentA = (e.votesFor / total) * 100;
            const controversy = Math.abs(50 - percentA);
            return { ...e, controversy, percentA, percentB: 100 - percentA, totalVotes: total };
          })
          .sort((a, b) => a.controversy - b.controversy)[0] || null;

        setMostControversial(controversial);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const handleVoteUpdate = async () => {
      const votedIds = await loadVotes();
      setVotedEffectIds(votedIds);
    };
    
    window.addEventListener('votes-updated', handleVoteUpdate); // Слушаем наш кастомный ивент
    return () => window.removeEventListener('votes-updated', handleVoteUpdate);
  }, []);

  // Синхронизация счетчика из стора
  useEffect(() => {
    const updateVotes = () => {
      const votes = votesStore.get();
      setVoteCount(Object.keys(votes).length);
    };
    updateVotes();
    window.addEventListener('votes-updated', updateVotes);
    return () => window.removeEventListener('votes-updated', updateVotes);
  }, []);

  // ПРАВИЛЬНЫЙ ПОДСЧЕТ СТАТИСТИКИ
  useEffect(() => {
    const calculateUserStats = async () => {
      const votes = votesStore.get();
      const votedIds = Object.keys(votes);

      if (votedIds.length === 0) {
        setUserStats({ voted: 0, inMajority: 0, inMinority: 0, uniqueMemory: 0 });
        return;
      }

      // Запрашиваем актуальные данные с сервера
      const effectsRes = await getEffectsByIds(votedIds);
      
      if (effectsRes.success && effectsRes.data) {
        let inMajority = 0;
        let inMinority = 0;

        effectsRes.data.forEach((effect: any) => {
          const myVote = votes[effect.id];
          const countA = effect.votesFor || 0;
          const countB = effect.votesAgainst || 0;
          
          const majorityVariant = countA >= countB ? 'A' : 'B';
          
          if (myVote === majorityVariant) {
            inMajority++;
          } else {
            inMinority++;
          }
        });

        setUserStats({
          voted: votedIds.length,
          inMajority,
          inMinority,
          uniqueMemory: 0
        });
      }
    };

    calculateUserStats();
    window.addEventListener('votes-updated', calculateUserStats);
    return () => window.removeEventListener('votes-updated', calculateUserStats);
  }, []);

  const countEffects = useCountUp(stats.totalEffects, 800, stats.totalEffects > 0);
  const countParticipants = useCountUp(stats.totalParticipants, 800, stats.totalParticipants > 0);
  const countVotes = useCountUp(stats.totalVotes, 800, stats.totalVotes > 0);

  const StatSkeleton = () => <span className="inline-block h-8 w-24 bg-white/10 animate-pulse rounded" />;

  // Для спорного эффекта
  const controversialSafeUrl = mostControversial?.imageUrl ? mostControversial.imageUrl.replace(/'/g, '%27') : null;

  return (
    <main id="main-content" className="min-h-screen" role="main">
      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-center items-center px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-darkCard to-dark" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          <div className="mb-6"><GlitchTitle text="Как ты помнишь?" /></div>
          <motion.p className="text-xl md:text-2xl text-light/90 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>Все помнят по-разному. Исследуй различия в восприятии</motion.p>
          <motion.div className="flex flex-wrap justify-center gap-8 mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-2"><Brain className="w-6 h-6 text-primary" /><span className="font-semibold text-lg md:text-xl text-light/90">{loading ? <StatSkeleton /> : `${countEffects.toLocaleString('ru-RU')} эффектов`}</span></div>
            <span className="hidden md:inline text-light/40">•</span>
            <div className="flex items-center gap-2"><Users className="w-6 h-6 text-secondary" /><span className="font-semibold text-lg md:text-xl text-light/90">{loading ? <StatSkeleton /> : `${countParticipants.toLocaleString('ru-RU')} участников`}</span></div>
            <span className="hidden md:inline text-light/40">•</span>
            <div className="flex items-center gap-2"><MessageSquare className="w-6 h-6 text-amber-400" /><span className="font-semibold text-lg md:text-xl text-light/90">{loading ? <StatSkeleton /> : `${countVotes.toLocaleString('ru-RU')} голосов`}</span></div>
          </motion.div>
        </motion.div>
        <motion.div className="absolute bottom-24 left-1/2 -translate-x-1/2" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} className="w-12 h-12 rounded-full border-2 border-light/30 flex items-center justify-center hover:border-primary hover:bg-primary/10 transition-all"><svg className="w-6 h-6 text-light/60" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg></button>
        </motion.div>
      </section>

      {/* Быстрый старт */}
      <section className="py-16 px-4 bg-dark">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => redirectToRandomEffect()} className="block w-full group">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-glitch relative flex items-center justify-between p-6 h-28 rounded-2xl border border-indigo-500/20 hover:border-indigo-500/50 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm overflow-hidden transition-all">
                <div className="flex items-center gap-4 z-10"><div className="text-indigo-400"><Sparkles className="w-8 h-8" /></div><div className="text-left"><div className="font-bold text-lg text-indigo-100">Случайный</div><div className="text-xs text-light/50 font-medium">Испытай удачу</div></div></div>
                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/80 transition-colors z-10" />
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
              </motion.div>
            </button>
            <Link href="/quiz" className="block w-full group">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-glitch relative flex items-center justify-between p-6 h-28 rounded-2xl border border-orange-500/20 hover:border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm overflow-hidden transition-all">
                <div className="flex items-center gap-4 z-10"><div className="text-orange-400"><Activity className="w-8 h-8" /></div><div className="text-left"><div className="font-bold text-lg text-orange-100">Пройти тест</div><div className="text-xs text-light/50 font-medium">Проверь память</div></div></div>
                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/80 transition-colors z-10" />
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
              </motion.div>
            </Link>
            <Link href="/catalog" className="block w-full group">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-glitch relative flex items-center justify-between p-6 h-28 rounded-2xl border border-emerald-500/20 hover:border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 backdrop-blur-sm overflow-hidden transition-all">
                <div className="flex items-center gap-4 z-10"><div className="text-emerald-400"><Search className="w-8 h-8" /></div><div className="text-left"><div className="font-bold text-lg text-emerald-100">Весь каталог</div><div className="text-xs text-light/50 font-medium">Исследуй все</div></div></div>
                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/80 transition-colors z-10" />
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* Самое спорное (С ГЛИТЧЕМ) */}
      <section className="py-16 px-4 bg-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-light flex items-center justify-center gap-2">
            Самое спорное сейчас <TrendingUp className="w-8 h-8 text-red-400" />
          </h2>
          {loading ? <ControversialSkeleton /> : mostControversial ? (
            <Link href={`/effect/${mostControversial.id}`} className="block">
              <div className="bg-darkCard rounded-2xl border-2 border-red-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 cursor-pointer overflow-hidden group">
                {/* Изображение с глитчем */}
                {mostControversial.imageUrl && controversialSafeUrl && (
                  <div className="relative w-full h-64 md:h-80 glitch-wrapper">
                    <ImageWithSkeleton src={mostControversial.imageUrl} alt={mostControversial.title} fill className="object-cover relative z-[1]" priority />
                    <div className="glitch-layers absolute inset-0 z-[2]">
                        <div className="glitch-layer" style={{ backgroundImage: `url('${controversialSafeUrl}')` }} />
                        <div className="glitch-layer" style={{ backgroundImage: `url('${controversialSafeUrl}')` }} />
                        <div className="glitch-layer" style={{ backgroundImage: `url('${controversialSafeUrl}')` }} />
                    </div>
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-light/70">{getCategoryIcon(mostControversial.category, "w-8 h-8")}</div>
                    <h3 className="text-2xl md:text-3xl font-bold text-light">{mostControversial.title}</h3>
                  </div>
                  <p className="text-lg md:text-xl text-light/90 mb-6">{mostControversial.description}</p>
                  <div className="flex justify-between mb-6 text-sm text-light/60"><span>Вариант А</span><span>Вариант Б</span></div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-primary">{Math.round(mostControversial.percentA)}%</span>
                      <span className="text-lg font-semibold text-secondary">{Math.round(mostControversial.percentB)}%</span>
                    </div>
                    <div className="relative h-3 rounded-full bg-dark/50">
                      <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(to right, #3b82f6, #f59e0b)' }} />
                      <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-light rounded-full border-2 border-dark shadow-lg z-10" style={{ left: `calc(${mostControversial.percentA}% - 8px)` }} />
                    </div>
                  </div>
                  <p className="text-center text-light/60 mb-6">{mostControversial.totalVotes.toLocaleString('ru-RU')} голосов</p>
                  <div className="text-center">
                    <button className="text-light font-semibold px-6 py-3 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 mx-auto" style={{ background: 'linear-gradient(to right, #3b82f6, #f59e0b)' }}>
                      Посмотреть и проголосовать <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ) : <ControversialSkeleton />}
        </div>
      </section>

      {/* Новые эффекты */}
      <section className="py-16 px-4 bg-darkCard">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-light flex items-center gap-2">Новые эффекты <SparklesIcon className="w-8 h-8 text-primary" /></h2>
            <Link href="/catalog" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2">Смотреть все <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? [1, 2, 3].map(i => <EffectCardSkeleton key={i} />) : newEffects.map((effect, index) => (
              <motion.div key={effect.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}>
                <EffectCard id={effect.id} title={effect.title} description={effect.description} category={effect.category} imageUrl={effect.imageUrl} votesFor={effect.votesFor} votesAgainst={effect.votesAgainst} createdAt={effect.createdAt} badge="Новое" hasVoted={votedEffectIds.includes(effect.id)} priority={index < 2} className="bg-dark border-light/10 hover:border-primary/50 hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.4)]" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Популярное */}
      <section className="py-16 px-4 bg-dark">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-light flex items-center justify-center gap-2">Популярное за неделю <TrendingUp className="w-8 h-8 text-secondary" /></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? [1, 2, 3].map(i => <EffectCardSkeleton key={i} />) : popularEffects.map((effect, index) => (
              <EffectCard key={effect.id} id={effect.id} title={effect.title} description={effect.description} category={effect.category} imageUrl={effect.imageUrl} votesFor={effect.votesFor} votesAgainst={effect.votesAgainst} badge={`#${index + 1}`} showProgress={true} hasVoted={votedEffectIds.includes(effect.id)} className="bg-darkCard border-2 border-light/10 hover:border-secondary/50 hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.4)]" />
            ))}
          </div>
        </div>
      </section>

      {/* Твоя статистика */}
      {voteCount > 0 && (
        <section className="py-16 px-4 bg-darkCard">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-light flex items-center justify-center gap-2">Твоя статистика <Activity className="w-8 h-8 text-primary" /></h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark p-6 rounded-xl text-center transform transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-lg cursor-default">
                <div className="flex justify-center mb-2"><CheckCircle className="w-10 h-10 text-primary" /></div>
                <div className="text-3xl font-bold text-primary mb-1">{voteCount}</div>
                <div className="text-sm text-light/60">Проголосовано</div>
              </div>
              <div className="bg-dark p-6 rounded-xl text-center transform transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-lg cursor-default">
                <div className="flex justify-center mb-2"><Users2 className="w-10 h-10 text-blue-400" /></div>
                <div className="text-3xl font-bold text-blue-400 mb-1">{userStats.inMajority}</div>
                <div className="text-sm text-light/60">В большинстве</div>
              </div>
              <div className="bg-dark p-6 rounded-xl text-center transform transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-lg cursor-default">
                <div className="flex justify-center mb-2"><SparklesIcon className="w-10 h-10 text-secondary" /></div>
                <div className="text-3xl font-bold text-secondary mb-1">{userStats.inMinority}</div>
                <div className="text-sm text-light/60">В меньшинстве</div>
              </div>
              <div className="bg-dark p-6 rounded-xl text-center transform transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-lg cursor-default">
                <div className="flex justify-center mb-2"><Star className="w-10 h-10 text-purple-400" /></div>
                <div className="text-3xl font-bold text-purple-400 mb-1">{userStats.uniqueMemory}</div>
                <div className="text-sm text-light/60">Уникальная память</div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link href="/my-memory"><button className="px-6 py-3 bg-primary hover:bg-primary/80 text-light font-semibold rounded-lg transition-colors flex items-center gap-2 mx-auto">Подробная статистика <ArrowRight className="w-4 h-4" /></button></Link>
            </div>
          </div>
        </section>
      )}

      {/* О проекте */}
      <section className="py-16 px-4 bg-darkCard">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-light flex items-center justify-center gap-2">О проекте <Info className="w-8 h-8 text-primary" /></h2>
          <div className="bg-dark p-8 rounded-xl text-lg leading-relaxed text-light/90">
            <p className="mb-4">Эффект Манделы - это феномен ложных воспоминаний, когда множество людей помнят события или детали иначе, чем они есть на самом деле.</p>
            <p className="mb-4">Этот проект исследует, как по-разному люди помнят одно и то же.</p>
            <p className="text-yellow-400 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Важно: нет правильных ответов - есть разные восприятия.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
