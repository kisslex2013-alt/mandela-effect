'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Flame, Activity, Zap, Users, CheckCircle, Clock, Hash } from 'lucide-react';
import EffectCard from '@/components/EffectCard';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import StrangerVote from '@/components/ui/StrangerVote';
import { votesStore } from '@/lib/votes-store';
import { saveVote, getUserVote } from '@/app/actions/votes';
import toast from 'react-hot-toast';

interface HomeClientProps {
  trendingEffects: any[];
  newEffects: any[];
  topCategories: any[];
  globalStats: any;
  effectOfDay?: any;
}

export default function HomeClient({ 
  trendingEffects, 
  newEffects, 
  topCategories, 
  globalStats,
  effectOfDay 
}: HomeClientProps) {
  const [mounted, setMounted] = useState(false);
  
  // Состояние для Эффекта Дня
  const [dayVote, setDayVote] = useState<'A' | 'B' | null>(null);
  const [dayVotes, setDayVotes] = useState({ for: 0, against: 0 });
  const [isDayVoting, setIsDayVoting] = useState(false);
  
  // Состояние для "Твоего вклада"
  const [userContribution, setUserContribution] = useState(0);
  
  // Состояние для таймера
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    
    const localVotes = votesStore.get();
    setUserContribution(Object.keys(localVotes).length);
    
    if (effectOfDay) {
      setDayVotes({ for: effectOfDay.votesFor, against: effectOfDay.votesAgainst });
      
      if (localVotes[effectOfDay.id]) {
        setDayVote(localVotes[effectOfDay.id]);
      }

      const visitorId = localStorage.getItem('visitorId');
      if (visitorId) {
        getUserVote(visitorId, effectOfDay.id).then(result => {
          if (result && result.variant) {
            const variant = result.variant as 'A' | 'B';
            setDayVote(variant);
            votesStore.set(effectOfDay.id, variant);
          }
        });
      }
    }
  }, [effectOfDay]);

  // Таймер
  useEffect(() => {
    if (!effectOfDay?.nextReset) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const resetTime = new Date(effectOfDay.nextReset).getTime();
      const difference = resetTime - now;

      if (difference <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [effectOfDay?.nextReset]);

  const handleDayVote = async (variant: 'A' | 'B') => {
    if (!effectOfDay || isDayVoting || dayVote) return;

    setIsDayVoting(true);
    setDayVote(variant);
    setDayVotes(prev => ({ 
      for: variant === 'A' ? prev.for + 1 : prev.for, 
      against: variant === 'B' ? prev.against + 1 : prev.against 
    }));
    votesStore.set(effectOfDay.id, variant);
    setUserContribution(prev => prev + 1);

    try {
      let visitorId = localStorage.getItem('visitorId');
      if (!visitorId) { visitorId = crypto.randomUUID(); localStorage.setItem('visitorId', visitorId); }
      const result = await saveVote({ visitorId, effectId: effectOfDay.id, variant });
      
      if (!result.success) {
        if (result.vote) {
          setDayVote(result.vote.variant as 'A' | 'B');
          toast.success('Вы уже голосовали');
        } else {
          setDayVote(null);
          setDayVotes({ for: effectOfDay.votesFor, against: effectOfDay.votesAgainst });
          toast.error('Ошибка');
        }
      } else {
        toast.success('Голос записан');
      }
    } catch (error) {
      setDayVote(null);
    } finally {
      setIsDayVoting(false);
    }
  };

  const parseDayVariants = () => {
    let vA = "Как я помню";
    let vB = "Как в реальности";
    if (effectOfDay?.content) {
      const matchA = effectOfDay.content.match(/Вариант А:\s*(.*?)(?:\n|$)/);
      const matchB = effectOfDay.content.match(/Вариант Б:\s*(.*?)(?:\n|$)/);
      if (matchA && matchA[1]) vA = matchA[1].trim();
      if (matchB && matchB[1]) vB = matchB[1].trim();
    }
    return { vA, vB };
  };
  const { vA, vB } = parseDayVariants();

  if (!mounted) return <div className="min-h-screen bg-dark" />;

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-5xl mx-auto mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight glitch-text" data-text="ЭФФЕКТ МАНДЕЛЫ">
                ЭФФЕКТ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">МАНДЕЛЫ</span>
              </h1>
              <p className="text-xl text-light/60 mb-12 leading-relaxed max-w-2xl mx-auto">
                Сбой в матрице или ложная память? Исследуй коллективные заблуждения и проверь свою реальность.
              </p>
              
              {/* STATS BAR */}
              <div className="w-full max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 bg-white/5 backdrop-blur-md border border-light/10 rounded-2xl mb-12 shadow-2xl divide-x divide-y md:divide-y-0 divide-light/10 overflow-hidden">
                <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2 mb-1 text-cyan-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-xl font-mono font-bold text-white">{globalStats.totalEffects}</span>
                  </div>
                  <span className="text-[10px] text-light/40 uppercase font-bold tracking-wider">Эффектов</span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2 mb-1 text-cyan-400">
                    <Users className="w-4 h-4" />
                    <span className="text-xl font-mono font-bold text-white">{globalStats.totalParticipants}</span>
                  </div>
                  <span className="text-[10px] text-light/40 uppercase font-bold tracking-wider">Участников</span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2 mb-1 text-yellow-400">
                    <Activity className="w-4 h-4" />
                    <span className="text-xl font-mono font-bold text-white">{globalStats.totalVotes}</span>
                  </div>
                  <span className="text-[10px] text-light/40 uppercase font-bold tracking-wider">Голосов</span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2 mb-1 text-red-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xl font-mono font-bold text-white">{userContribution}</span>
                  </div>
                  <span className="text-[10px] text-red-400/60 uppercase font-bold tracking-wider">Твой вклад</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* EFFECT OF THE DAY - NETFLIX STYLE */}
          {effectOfDay && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              <div className="relative h-[550px] w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                
                {/* 1. BACKGROUND IMAGE LAYER */}
                <div className="absolute inset-0 z-0">
                  <Link href={`/effect/${effectOfDay.id}`} className="block w-full h-full relative">
                    {effectOfDay.imageUrl ? (
                      <>
                        <ImageWithSkeleton 
                          src={effectOfDay.imageUrl} 
                          alt={effectOfDay.title} 
                          fill 
                          className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                        />
                        {/* Glitch Layers */}
                        <div className="absolute inset-0 bg-primary/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-100 animate-pulse" />
                        <div className="absolute inset-0 bg-red-500/10 mix-blend-color-dodge opacity-0 group-hover:opacity-30 transition-opacity duration-75" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-black/50 flex items-center justify-center"><span className="text-6xl">👾</span></div>
                    )}
                  </Link>
                </div>

                {/* 2. CINEMATIC GRADIENTS */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />

                {/* 3. MYSTICISM: NOISE TEXTURE */}
                <div className="absolute inset-0 z-10 opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

                {/* 4. CONTENT LAYER */}
                <div className="relative z-20 h-full flex flex-col justify-center p-6 md:p-12 max-w-3xl">
                  
                  {/* Header: Badge + Timer */}
                  <div className="flex flex-wrap items-center gap-4 mb-8">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                      <Sparkles className="w-3 h-3" /> Эффект дня
                    </div>
                    {effectOfDay?.nextReset && (
                      <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400/80 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                        <Clock className="w-3 h-3" />
                        <span className="animate-pulse tracking-widest">ДО СДВИГА РЕАЛЬНОСТИ:</span>
                        <span className="text-cyan-300 font-bold text-xs">{timeLeft}</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Desc */}
                  <Link href={`/effect/${effectOfDay.id}`} className="block group-hover:text-primary transition-colors">
                    <h2 className="text-4xl md:text-7xl font-black text-white mb-6 leading-none tracking-tight drop-shadow-lg">
                      {effectOfDay.title}
                    </h2>
                  </Link>
                  <p className="text-lg md:text-xl text-light/80 mb-10 line-clamp-3 leading-relaxed max-w-xl border-l-2 border-primary/50 pl-6">
                    {effectOfDay.description}
                  </p>

                  {/* Vote */}
                  <div className="mb-10 max-w-xl">
                    <StrangerVote 
                      variantA={vA} 
                      variantB={vB} 
                      votesFor={dayVotes.for} 
                      votesAgainst={dayVotes.against} 
                      userVote={dayVote} 
                      onVote={handleDayVote} 
                      isVoting={isDayVoting} 
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-6 mt-auto">
                    <Link href={`/effect/${effectOfDay.id}`} className="flex items-center gap-2 text-sm font-bold text-black bg-white hover:bg-primary hover:text-white transition-all px-6 py-3 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                      Исследовать аномалию <ArrowRight className="w-4 h-4" />
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-light/30">
                      <Hash className="w-3 h-3" />
                      <span>SYSTEM_LOG_ID: {effectOfDay.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Trending Section */}
      <section className="container mx-auto px-4 mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Flame className="w-6 h-6 text-orange-500" /> В тренде
          </h2>
          <Link href="/catalog?sort=popular" className="text-sm text-light/50 hover:text-white transition-colors flex items-center gap-1">
            ПОКАЗАТЬ ВСЕ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trendingEffects.map((effect, i) => (
            <EffectCard key={effect.id} effect={effect} badge={`#${i + 1}`} priority />
          ))}
        </div>
      </section>

      {/* New Effects Section */}
      <section className="container mx-auto px-4 mb-20">
        <div className="flex items-center justify-center mb-12">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-yellow-400" /> Новые обнаружения
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newEffects.map((effect) => (
            <EffectCard key={effect.id} effect={effect} badge="НОВОЕ" />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/catalog?sort=newest" className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all hover:scale-105 border border-white/5">
            Открыть полный архив <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
