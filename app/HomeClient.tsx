'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Flame, Activity, Zap, Users, CheckCircle, Clock, Hash, ChevronDown, AlertTriangle } from 'lucide-react';
import EffectCard from '@/components/EffectCard';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import StrangerVote from '@/components/ui/StrangerVote';
import UserContribution from '@/components/home/UserContribution';
import { votesStore } from '@/lib/votes-store';
import { saveVote, getUserVote } from '@/app/actions/votes';
import { generateSystemLog } from '@/lib/system-logs';
import { useReality } from '@/lib/context/RealityContext';
import { getClientVisitorId } from '@/lib/client-visitor';
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
  const router = useRouter();
  const { incrementVotes, isUpsideDown } = useReality(); // Получаем режим
  const [mounted, setMounted] = useState(false);
  
  const [dayVote, setDayVote] = useState<'A' | 'B' | null>(null);
  const [dayVotes, setDayVotes] = useState({ for: 0, against: 0 });
  const [isDayVoting, setIsDayVoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const systemLog = effectOfDay ? generateSystemLog(effectOfDay.title) : '';

  useEffect(() => {
    setMounted(true);
    const localVotes = votesStore.get();
    
    if (effectOfDay) {
      setDayVotes({ for: effectOfDay.votesFor, against: effectOfDay.votesAgainst });
      if (localVotes[effectOfDay.id]) setDayVote(localVotes[effectOfDay.id]);

      const visitorId = getClientVisitorId();
      if (visitorId) {
        getUserVote(visitorId, effectOfDay.id).then(result => {
          if (result && result.variant) {
            setDayVote(result.variant as 'A' | 'B');
            votesStore.set(effectOfDay.id, result.variant as 'A' | 'B');
          }
        });
      }
    }
  }, [effectOfDay]);

  useEffect(() => {
    if (!effectOfDay?.nextReset) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const resetTime = new Date(effectOfDay.nextReset).getTime();
      const difference = resetTime - now;
      if (difference <= 0) { setTimeLeft('00:00:00'); return; }
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [effectOfDay?.nextReset]);

  const handleDayVote = async (variant: 'A' | 'B') => {
    if (!effectOfDay || isDayVoting || dayVote) return;

    // Проверяем, голосовал ли пользователь за этот эффект ДО установки нового голоса
    const hasVoted = !!votesStore.get()[effectOfDay.id];

    setIsDayVoting(true);
    setDayVote(variant);
    setDayVotes(prev => ({ for: variant === 'A' ? prev.for + 1 : prev.for, against: variant === 'B' ? prev.against + 1 : prev.against }));
    votesStore.set(effectOfDay.id, variant);

    // Если пользователь еще не голосовал за этот эффект, обновляем счетчик
    if (!hasVoted) {
      incrementVotes();
    }

    try {
      const visitorId = getClientVisitorId();
      const result = await saveVote({ visitorId, effectId: effectOfDay.id, variant });
      if (!result.success) {
        if (result.vote) { setDayVote(result.vote.variant as 'A' | 'B'); toast.success('Вы уже голосовали'); }
        else { setDayVote(null); setDayVotes({ for: effectOfDay.votesFor, against: effectOfDay.votesAgainst }); toast.error('Ошибка'); }
      } else toast.success('Голос записан');
    } catch (error) { setDayVote(null); } finally { setIsDayVoting(false); }
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
    <div className="pb-20 relative">
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center py-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 flex-1 flex flex-col justify-center items-center">
          
          {/* Title & Stats */}
          <div className="text-center max-w-5xl mx-auto mb-12 w-full">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
              <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight glitch-text" data-text="ЭФФЕКТ МАНДЕЛЫ">
                ЭФФЕКТ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">МАНДЕЛЫ</span>
              </h1>
              <p className="text-lg md:text-xl text-light/60 leading-relaxed max-w-2xl mx-auto">
                Сбой в матрице или ложная память? Исследуй коллективные заблуждения и проверь свою реальность.
              </p>
              
              {/* STATS BAR */}
              <div className="w-full max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 bg-[#111] border border-white/10 rounded-2xl shadow-2xl divide-x divide-y md:divide-y-0 divide-white/10 overflow-hidden">
                <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2 mb-1 text-cyan-400"><Zap className="w-4 h-4" /><span className="text-xl font-mono font-bold text-white">{globalStats.totalEffects}</span></div>
                  <span className="text-[10px] text-light/40 uppercase font-bold tracking-wider">Эффектов</span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2 mb-1 text-cyan-400"><Users className="w-4 h-4" /><span className="text-xl font-mono font-bold text-white">{globalStats.totalParticipants}</span></div>
                  <span className="text-[10px] text-light/40 uppercase font-bold tracking-wider">Участников</span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2 mb-1 text-yellow-400"><Activity className="w-4 h-4" /><span className="text-xl font-mono font-bold text-white">{globalStats.totalVotes}</span></div>
                  <span className="text-[10px] text-light/40 uppercase font-bold tracking-wider">Голосов</span>
                </div>
                {/* 4-я карточка: Твой вклад */}
                <UserContribution />
              </div>
            </motion.div>
          </div>

          {/* EFFECT OF THE DAY */}
          {effectOfDay && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: 0.3 }}
              className="max-w-7xl w-full"
            >
              <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl group min-h-[600px] md:aspect-video flex flex-col">
                
                {/* 1. BACKGROUND IMAGE LAYER */}
                <div className={`absolute inset-0 z-0 glitch-wrapper ${isUpsideDown ? 'glitch-mirror' : ''}`}>
                  <Link href={`/effect/${effectOfDay.id}`} className="block w-full h-full relative">
                    {effectOfDay.imageUrl ? (
                      <>
                        {(() => {
                          const safeImageUrl = effectOfDay.imageUrl.replace(/'/g, '%27');
                          return (
                            <>
                              <ImageWithSkeleton 
                                src={effectOfDay.imageUrl} 
                                alt={effectOfDay.title} 
                                fill 
                                priority={true}
                                className="object-cover transition-transform duration-1000 group-hover:scale-105 relative z-[1]" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-dark opacity-80 z-[1]"></div>
                              
                              {/* ГЛИТЧ СЛОИ (Добавлены) */}
                              <div className={`glitch-layers absolute inset-0 z-[2] opacity-0 group-hover:opacity-100 transition-opacity ${isUpsideDown ? 'glitch-mirror' : ''}`}>
                                <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
                                <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
                                <div className="glitch-layer" style={{ backgroundImage: `url('${safeImageUrl}')` }} />
                              </div>
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <div className="w-full h-full bg-black/50 flex items-center justify-center"><span className="text-6xl">👾</span></div>
                    )}
                  </Link>
                </div>

                {/* 2. CINEMATIC GRADIENTS */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
                <div className="absolute inset-0 z-10 opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

                {/* 3. CONTENT LAYER */}
                <div className="relative z-30 p-6 md:p-12 max-w-3xl w-full flex flex-col justify-center flex-1">
                  
                  {/* Header: Badge + Timer */}
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                      <Sparkles className="w-3 h-3" /> Эффект дня
                    </div>
                    {effectOfDay?.nextReset && (
                      <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400/80 bg-black/40 px-3 py-1 rounded-full border border-white/5 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
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
                  <p className="relative z-30 text-lg md:text-xl text-light/90 mb-10 leading-relaxed max-w-xl border-l-2 border-primary/50 pl-6 drop-shadow-md">
                    {effectOfDay.description}
                  </p>
                  
                  {/* Vote */}
                  <div className="mb-8 max-w-xl">
                    <StrangerVote 
                      variantA={vA} 
                      variantB={vB} 
                      votesFor={dayVotes.for} 
                      votesAgainst={dayVotes.against} 
                      userVote={dayVote} 
                      onVote={handleDayVote} 
                      isVoting={isDayVoting}
                      onOpenCard={() => router.push(`/effect/${effectOfDay.id}`)}
                      openOnClick={true}
                    />
                  </div>

                  {/* Footer (Compact Button + Log) */}
                  <div className="flex flex-wrap items-center gap-6 mt-auto">
                    <Link 
                      href={`/effect/${effectOfDay.id}`} 
                      className="flex items-center gap-2 text-sm font-bold text-black bg-white hover:bg-primary hover:text-white transition-all px-6 py-3 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] w-fit"
                    >
                      Исследовать аномалию <ArrowRight className="w-4 h-4" />
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-green-500/60 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                      <Hash className="w-3 h-3" />
                      <span className="uppercase tracking-wider">{systemLog}<span className="animate-pulse">_</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Scroll Indicator */}
          <motion.button
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 1, duration: 1 }}
            onClick={() => {
              const trendingSection = document.getElementById('trending-section');
              if (trendingSection) {
                const headerHeight = 100;
                const elementPosition = trendingSection.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerHeight;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
              }
            }}
            className="mt-8 text-light/30 hover:text-light/60 transition-colors cursor-pointer animate-bounce flex items-center justify-center"
          >
            <ChevronDown className="w-8 h-8" />
          </motion.button>
        </div>
      </section>

      {/* Trending Section */}
      <section id="trending-section" className="max-w-7xl mx-auto px-4 mb-20 pt-24 scroll-mt-24">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Flame className="w-6 h-6 text-orange-500" /> В тренде</h2>
          <Link href="/catalog?sort=popular" className="text-sm text-light/50 hover:text-white transition-colors flex items-center gap-1">ПОКАЗАТЬ ВСЕ <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingEffects.map((effect, i) => (
            <EffectCard key={effect.id} effect={effect} badge={`#${i + 1}`} priority />
          ))}
        </div>
      </section>

      {/* New Effects Section */}
      <section className="max-w-7xl mx-auto px-4 mb-20">
        <div className="flex items-center justify-center mb-12">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Sparkles className="w-6 h-6 text-yellow-400" /> Новые обнаружения</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newEffects.map((effect) => (
            <EffectCard key={effect.id} effect={effect} badge="НОВОЕ" />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/catalog?sort=newest" className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all hover:scale-105 border border-white/5">Открыть полный архив <ArrowRight className="w-5 h-5" /></Link>
        </div>
      </section>

      {/* Warning Block */}
      <section className="max-w-7xl mx-auto px-4 mt-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border-2 border-red-500/30 rounded-3xl p-8 md:p-12 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:20px_20px] animate-[slide_20s_linear_infinite] opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="p-4 bg-red-500/20 rounded-full border-2 border-red-500/50 animate-pulse">
                <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-red-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
                <span className="text-red-400">ВНИМАНИЕ:</span>{' '}
                <span className="glitch-text" data-text="ЗОНА НЕСТАБИЛЬНОСТИ">ЗОНА НЕСТАБИЛЬНОСТИ</span>
              </h3>
              <p className="text-base md:text-lg text-light/80 leading-relaxed mb-4">
                Данные в этом архиве могут противоречить вашим воспоминаниям. Это нормально. 
                Коллективная память подвержена искажениям, и каждый видит реальность по-своему.
              </p>
              <p className="text-sm md:text-base text-light/60 font-mono">
                &gt; Если вы обнаружили расхождение — вы не одиноки. Это и есть эффект Манделы.
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
