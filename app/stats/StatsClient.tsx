'use client';

import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { useReality } from '@/lib/context/RealityContext';
import { Activity, Users, Zap, AlertTriangle, FileText, Music, Globe, Film, Ghost, Gamepad2, Baby, Tag } from 'lucide-react';
import ReactorChart from '@/components/stats/ReactorChart';
import SpectrumChart from '@/components/stats/SpectrumChart';
import LiveLog from '@/components/stats/LiveLog';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import Link from 'next/link';

interface Effect { 
  id: string; 
  title: string; 
  category: string; 
  votesFor: number; 
  votesAgainst: number; 
  imageUrl: string | null; 
}

interface StatsClientProps { 
  effects: Effect[]; 
  totalParticipants: number; 
  totalVotes: number; 
}

// KPI Модуль (Серверная стойка)
const StatModule = ({ label, value, icon: Icon, isUpsideDown, delay = 0 }: any) => (
  <m.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`relative p-4 rounded-lg border overflow-hidden group ${
      isUpsideDown 
        ? 'bg-red-950/20 border-red-500/40 shadow-[0_0_15px_rgba(220,38,38,0.1)]' 
        : 'bg-darkCard border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
    }`}
  >
    {/* Индикатор работы */}
    <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${
        isUpsideDown ? 'bg-red-500 animate-ping' : 'bg-green-500 animate-pulse'
    }`} />
    
    {/* Иконка, значение и лейбл в одну строку, выровнено по левому краю */}
    <div className="flex items-center gap-2">
      <div className={`p-2 rounded bg-white/5 ${isUpsideDown ? 'text-red-500' : 'text-cyan-400'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={`text-2xl font-black font-mono ${
        isUpsideDown ? 'text-red-100 glitch-text' : 'text-white'
      }`} data-text={value}>
        {value}
      </div>
      <span className="text-[10px] font-mono uppercase tracking-widest text-light/50 whitespace-nowrap">
        {label}
      </span>
    </div>
  </m.div>
);

// Карточка "Секретный Архив" (Спорные)
const SecretFileCard = ({ effect, isUpsideDown }: any) => (
  <Link href={`/effect/${effect.id}`} className="block h-full">
    <div className={`relative h-full rounded-xl border p-1 transition-all duration-300 group ${
        isUpsideDown 
            ? 'bg-red-950/10 border-red-500/30 hover:border-red-500/60' 
            : 'bg-white/5 border-white/10 hover:border-white/30'
    }`}>
        {/* Фото (Ч/Б по умолчанию) */}
        <div className="relative aspect-video rounded-lg overflow-hidden mb-3 grayscale group-hover:grayscale-0 transition-all duration-500">
            {effect.imageUrl && (
                <ImageWithSkeleton src={effect.imageUrl} alt={effect.title} fill className="object-cover" />
            )}
            {/* Штамп */}
            <div className="absolute top-2 right-2 border-2 border-white/20 text-white/40 text-[8px] font-black px-1 uppercase rotate-12">
                EVIDENCE #{effect.id.slice(0,4)}
            </div>
        </div>

        <div className="px-2 pb-2">
            <h4 className="text-sm font-bold text-white mb-3 line-clamp-1">{effect.title}</h4>
            
            {/* Проценты и прогресс-бар в одну строку */}
            <div className="flex items-center gap-2">
                {/* Проценты A */}
                <span className="text-[10px] font-mono font-bold text-white whitespace-nowrap">
                    A: {Math.round((effect.votesFor / (effect.votesFor + effect.votesAgainst)) * 100)}%
                </span>
                
                {/* Tug of War Bar */}
                <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white z-10" /> {/* Центр */}
                    <div 
                        className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ${isUpsideDown ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${(effect.votesFor / (effect.votesFor + effect.votesAgainst)) * 100}%` }}
                    />
                </div>
                
                {/* Проценты B */}
                <span className="text-[10px] font-mono font-bold text-white whitespace-nowrap">
                    B: {Math.round((effect.votesAgainst / (effect.votesFor + effect.votesAgainst)) * 100)}%
                </span>
            </div>
        </div>
    </div>
  </Link>
);

export default function StatsClient({ effects, totalParticipants, totalVotes }: StatsClientProps) {
  const { isUpsideDown } = useReality();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Вычисляем статистику
  const mandelaVotes = effects.reduce((sum, e) => sum + e.votesFor, 0);
  const shiftIndex = totalVotes > 0 ? Math.round((mandelaVotes / totalVotes) * 100) : 0;

  // Спорные эффекты (50/50)
  const controversialEffects = [...effects]
    .filter(e => (e.votesFor + e.votesAgainst) > 5)
    .map(e => {
      const total = e.votesFor + e.votesAgainst;
      const ratio = (e.votesFor / total) * 100;
      return { ...e, diff: Math.abs(50 - ratio), total, percentA: ratio, percentB: 100 - ratio };
    })
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 3);

  // Данные для спектра (по категориям)
  const categoryStatsMap: Record<string, { mandela: number; total: number }> = {};
  effects.forEach(e => {
    if (!categoryStatsMap[e.category]) {
      categoryStatsMap[e.category] = { mandela: 0, total: 0 };
    }
    categoryStatsMap[e.category].mandela += e.votesFor;
    categoryStatsMap[e.category].total += (e.votesFor + e.votesAgainst);
  });

  // Данные для спектра (по категориям) - используем все доступные категории
  const categoryMap: Record<string, { name: string; icon: any }> = {
    'music': { name: 'Музыка', icon: Music },
    'geography': { name: 'География', icon: Globe },
    'films': { name: 'Фильмы', icon: Film },
    'russian': { name: 'СССР', icon: Ghost },
    'games': { name: 'Игры', icon: Gamepad2 },
    'childhood': { name: 'Детство', icon: Baby },
    'brands': { name: 'Бренды', icon: Tag },
    'popculture': { name: 'Поп-культура', icon: Film },
    'people': { name: 'Люди', icon: Users },
    'tv': { name: 'ТВ', icon: Film },
    'cartoons': { name: 'Мультфильмы', icon: Film },
    'tech': { name: 'Технологии', icon: Zap },
    'food': { name: 'Еда', icon: Tag },
    'history': { name: 'История', icon: Globe },
    'art': { name: 'Искусство', icon: Globe },
    'toys': { name: 'Игрушки', icon: Gamepad2 },
    'quotes': { name: 'Цитаты', icon: Users },
    'literature': { name: 'Литература', icon: Users },
  };

  const spectrumData = Object.entries(categoryStatsMap)
    .map(([slug, data]) => {
      const categoryInfo = categoryMap[slug] || { name: slug, icon: Tag };
      const value = data.total > 0 ? Math.round((data.mandela / data.total) * 100) : 0;
      return {
        name: categoryInfo.name,
        value,
        icon: categoryInfo.icon
      };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 7); // Показываем топ-7

  if (!mounted) {
    return <div className="min-h-screen bg-dark" />;
  }

  return (
    <m.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-dark pt-32 pb-20 relative overflow-hidden"
    >
      {/* Фоновая сетка */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Заголовок */}
        <m.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className={`text-4xl md:text-6xl font-black mb-4 tracking-tight uppercase glitch-text text-white`} data-text={isUpsideDown ? 'МОНИТОРИНГ СБОЕВ' : 'СТАТИСТИКА ПРОЕКТА'}>
            {isUpsideDown ? (
              <>
                МОНИТОРИНГ <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isUpsideDown ? 'from-red-500 to-purple-600' : 'from-cyan-400 to-blue-600'}`}>СБОЕВ</span>
              </>
            ) : (
              <>
                СТАТИСТИКА <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">ПРОЕКТА</span>
              </>
            )}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm font-mono text-light/60">
            <Activity className="w-4 h-4" />
            <span>Пульс коллективного бессознательного</span>
          </div>
        </m.div>

        {/* 1. KPI MODULES (Серверная стойка) */}
        <m.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
            <StatModule label={isUpsideDown ? "СБОЕВ" : "ЭФФЕКТОВ"} value={effects.length} icon={Zap} isUpsideDown={isUpsideDown} delay={0} />
            <StatModule label={isUpsideDown ? "ЗАРАЖЕННЫХ" : "УЧАСТНИКОВ"} value={totalParticipants} icon={Users} isUpsideDown={isUpsideDown} delay={0.1} />
            <StatModule label="ГОЛОСОВ" value={totalVotes} icon={Activity} isUpsideDown={isUpsideDown} delay={0.2} />
            <StatModule label="ИНДЕКС СДВИГА" value={`${shiftIndex}%`} icon={AlertTriangle} isUpsideDown={isUpsideDown} delay={0.3} />
        </m.div>

        <m.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid lg:grid-cols-[1fr_2fr_1fr] gap-6 mb-12"
        >
            {/* 2. ЯДРО (Реактор) */}
            <m.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className={`rounded-2xl border p-6 flex flex-col items-center justify-center min-h-[300px] ${
                isUpsideDown ? 'bg-black border-red-900/50' : 'bg-darkCard border-white/5'
            }`}>
                <div className="text-sm font-bold mb-6 uppercase tracking-widest">
                    Ядро <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">РЕАЛЬНОСТИ</span>
                </div>
                <ReactorChart percentage={shiftIndex} />
            </m.div>

            {/* 3. СПЕКТР (Категории) */}
            <m.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className={`rounded-2xl border p-6 ${
                isUpsideDown ? 'bg-black border-red-900/50' : 'bg-darkCard border-white/5'
            }`}>
                <div className="text-sm font-bold mb-6 uppercase tracking-widest">
                    Спектр <span className="text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">НЕСТАБИЛЬНОСТИ</span>
                </div>
                {spectrumData.length > 0 ? (
                    <SpectrumChart data={spectrumData} />
                ) : (
                    <div className="text-center text-light/40 py-8">Нет данных</div>
                )}
            </m.div>

            {/* 4. ЖИВОЙ ЛОГ (Sidebar) */}
            <m.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="hidden lg:block h-full" 
              style={{ minHeight: 0 }}
            >
                <LiveLog />
            </m.div>
        </m.div>

        {/* 5. СПОРНЫЕ (Секретный архив) */}
        <m.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
            <m.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex items-center gap-2 mb-6"
            >
                <AlertTriangle className={`w-5 h-5 ${isUpsideDown ? 'text-red-500' : 'text-yellow-500'}`} />
                <h2 className="text-xl font-bold text-white uppercase tracking-wide">Самые спорные (50/50)</h2>
            </m.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {controversialEffects.length > 0 ? (
                    controversialEffects.map((effect: any, index: number) => (
                        <m.div
                          key={effect.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                        >
                            <SecretFileCard effect={effect} isUpsideDown={isUpsideDown} />
                        </m.div>
                    ))
                ) : (
                    <div className="col-span-3 text-center text-light/40 py-8">
                        Нет спорных эффектов
                    </div>
                )}
            </div>
        </m.div>

      </div>
    </m.div>
  );
}
