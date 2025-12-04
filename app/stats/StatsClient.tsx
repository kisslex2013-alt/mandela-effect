'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Tooltip } from 'recharts';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import Link from 'next/link';
import { 
  Activity, Users, Brain, Zap, TrendingUp, AlertTriangle, 
  Film, Tag, Gamepad2, Globe, User, Music, Baby, Ghost, HelpCircle
} from 'lucide-react';
import { CATEGORY_MAP } from '@/lib/constants';
import { useCountUp } from '@/lib/hooks/useCountUp';
import GlitchTitle from '@/components/ui/GlitchTitle';

interface Effect { id: string; title: string; category: string; votesFor: number; votesAgainst: number; imageUrl: string | null; }

interface StatsClientProps { effects: Effect[]; totalParticipants: number; totalVotes: number; }

const PIE_COLORS = ['#a855f7', '#22c55e']; 

const CAT_COLORS: Record<string, string> = { films: '#3b82f6', brands: '#f97316', popculture: '#a855f7', music: '#ec4899', people: '#eab308', geography: '#06b6d4', childhood: '#84cc16', russian: '#ef4444', other: '#64748b' };

const SCENARIOS = [ ["> Initializing...", "> Connecting...", "> WARNING: Timeline divergence.", "> Shift: 89%."], ["> Scanning...", "> Sector [Cinema]: Check...", "> FAILED. Anomalies: 14.", "> Sector [Brands]: Check..."], ["> Parsing visual data...", "> Syncing Noosphere...", "> ANOMALY in [Pikachu].", "> Updating matrix..."] ];

const TerminalLine = ({ text }: { text: string }) => {
  const parts = text.split(/(FAILED|WARNING|CRITICAL|ANOMALY|MANDELA|DETECTED)/g);
  return <div className="whitespace-nowrap overflow-hidden">{parts.map((part, i) => (['FAILED', 'CRITICAL', 'ANOMALY', 'MANDELA'].includes(part) ? <span key={i} className="text-red-400/80 font-bold animate-pulse">{part}</span> : ['WARNING', 'DETECTED'].includes(part) ? <span key={i} className="text-yellow-400/80 font-bold">{part}</span> : <span key={i}>{part}</span>))}</div>;
};

const getCategoryIcon = (slug: string) => {
  const props = { width: 16, height: 16, className: "text-light/60" };
  switch (slug) { case 'films': return <Film {...props} />; case 'brands': return <Tag {...props} />; case 'popculture': return <Gamepad2 {...props} />; case 'geography': return <Globe {...props} />; case 'people': return <User {...props} />; case 'music': return <Music {...props} />; case 'childhood': return <Baby {...props} />; case 'russian': return <Ghost {...props} />; default: return <HelpCircle {...props} />; }
};

const CustomYAxisTick = ({ x, y, payload }: any) => {
  const slug = payload.value;
  const name = CATEGORY_MAP[slug]?.name || slug;
  return ( <g transform={`translate(${x},${y})`}> <foreignObject x={-140} y={-10} width={130} height={20}> <div className="flex items-center justify-end gap-2 h-full px-2"> <span className="text-[10px] text-gray-400 truncate text-right">{name}</span> {getCategoryIcon(slug)} </div> </foreignObject> </g> );
};


const SystemTerminal = () => {
  const [lines, setLines] = useState<string[]>(["> INITIALIZING..."]);
  
  useEffect(() => {
    const phrases = [
      "SCANNING SECTOR 7G...", "ANOMALY DETECTED: 98%", "SYNCING NOOSPHERE...", 
      "TIMELINE DIVERGENCE: 0.4%", "LOADING COLLECTIVE MEMORY...", "ERROR: REALITY NOT FOUND",
      "RECALIBRATING SENSORS...", "MANDELA EFFECT CONFIRMED", "UPDATING MATRIX...", "CONNECTION STABLE"
    ];
    
    const interval = setInterval(() => {
      const nextPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      // Убираем цветовое кодирование для фона, делаем всё монохромным зеленым
      const newLine = `> ${nextPhrase}`; 
      setLines(prev => [...prev.slice(-8), newLine]); 
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-24 left-4 md:left-10 z-0 font-mono text-[10px] leading-relaxed text-green-500/20 pointer-events-none select-none [mask-image:linear-gradient(135deg,black_40%,transparent_80%)]">
      <div className="mb-2 opacity-50">SYSTEM_LOGS_ACTIVE</div>
      <div className="flex flex-col">
        {lines.map((line, i) => (
          <div key={i} className="animate-fadeIn whitespace-nowrap">{line}</div>
        ))}
      </div>
    </div>
  );
};

// SKELETON
const StatsSkeleton = () => (
  <div className="min-h-screen bg-dark py-12 px-4">
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Заголовок */}
      <div className="text-center space-y-4">
        <div className="h-12 w-96 bg-white/5 rounded mx-auto animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>
        <div className="h-6 w-64 bg-white/5 rounded mx-auto animate-pulse" />
      </div>
      
      {/* HUD панель */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white/5 backdrop-blur-md border border-light/10 rounded-2xl p-6 animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            <div className="h-8 w-16 bg-white/10 rounded mb-2" />
            <div className="h-4 w-24 bg-white/10 rounded" />
          </div>
        ))}
      </div>
      
      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1,2].map(i => (
          <div key={i} className="bg-darkCard/30 border border-light/5 rounded-3xl p-8 h-80 animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            <div className="h-6 w-48 bg-white/10 rounded mb-4" />
            <div className="h-4 w-32 bg-white/10 rounded mb-8" />
            <div className="h-48 bg-white/5 rounded" />
          </div>
        ))}
      </div>
      
      {/* Список */}
      <div className="space-y-4">
        <div className="h-8 w-64 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-darkCard/30 border border-light/5 rounded-2xl h-64 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function StatsClient({ effects, totalParticipants, totalVotes }: StatsClientProps) {
  // 1. Сначала ВСЕ хуки
  const [mounted, setMounted] = useState(false);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [anomalyCount, setAnomalyCount] = useState(1420);

  // Все данные берутся из одного источника (пропсы из page.tsx):
  // - effects: массив эффектов из БД
  // - totalParticipants: количество уникальных visitorId из таблицы vote
  // - totalVotes: общее количество записей в таблице vote (prisma.vote.count())
  const globalStats = useMemo(() => {
    // Вычисляем общее количество голосов "за" Манделу из массива effects
    let mandelaVotes = 0;
    const categoryStats: Record<string, { mandela: number; total: number }> = {};
    effects.forEach(e => {
      mandelaVotes += e.votesFor;
      if (!categoryStats[e.category]) categoryStats[e.category] = { mandela: 0, total: 0 };
      categoryStats[e.category].mandela += e.votesFor;
      categoryStats[e.category].total += (e.votesFor + e.votesAgainst);
    });
    // Индекс сдвига = процент голосов "за" Манделу от общего количества голосов
    // Используем totalVotes из пропсов (из БД), чтобы данные были согласованы
    const shiftIndex = totalVotes > 0 ? Math.round((mandelaVotes / totalVotes) * 100) : 0;
    const categoryData = Object.entries(categoryStats).map(([slug, data]) => ({ slug, name: CATEGORY_MAP[slug]?.name || slug, percent: data.total > 0 ? Math.round((data.mandela / data.total) * 100) : 0, fill: CAT_COLORS[slug] || '#64748b' })).sort((a, b) => b.percent - a.percent).slice(0, 7); 
    const controversial = [...effects].filter(e => (e.votesFor + e.votesAgainst) > 5).map(e => { const total = e.votesFor + e.votesAgainst; const ratio = (e.votesFor / total) * 100; return { ...e, diff: Math.abs(50 - ratio), total, percentA: ratio, percentB: 100 - ratio }; }).sort((a, b) => a.diff - b.diff).slice(0, 3);
    return { mandelaVotes, realityVotes: totalVotes - mandelaVotes, shiftIndex, categoryData, controversial };
  }, [effects, totalVotes]);

  const pieData = [{ name: 'Мандела', value: globalStats.mandelaVotes }, { name: 'Реальность', value: globalStats.realityVotes }];

  // Хуки анимации должны быть здесь, ДО return
  // Все значения берутся из пропсов для согласованности данных:
  // - countEffects: количество эффектов из массива effects
  // - countParticipants: количество участников из пропса totalParticipants (из БД)
  // - countVotes: общее количество голосов из пропса totalVotes (из БД)
  const countEffects = useCountUp(effects.length, 1000, mounted);
  const countParticipants = useCountUp(totalParticipants, 1000, mounted);
  const countVotes = useCountUp(totalVotes, 1000, mounted);

  useEffect(() => setMounted(true), []);
  
  useEffect(() => {
    let lineIndex = 0, charIndex = 0, timeoutId: NodeJS.Timeout;
    const scenario = SCENARIOS[currentScenarioIndex];
    setDisplayedLines([]); 
    const typeNextChar = () => {
      if (lineIndex < scenario.length) {
        const currentLine = scenario[lineIndex];
        if (charIndex < currentLine.length) {
          setDisplayedLines(prev => { const newLines = [...prev]; if (!newLines[lineIndex]) newLines[lineIndex] = ''; newLines[lineIndex] = currentLine.slice(0, charIndex + 1); return newLines; });
          charIndex++; timeoutId = setTimeout(typeNextChar, 20);
        } else { lineIndex++; charIndex = 0; timeoutId = setTimeout(typeNextChar, 300); }
      } else { 
        timeoutId = setTimeout(() => setCurrentScenarioIndex(prev => (prev + 1) % SCENARIOS.length), 3000); 
      }
    };
    typeNextChar();
    return () => clearTimeout(timeoutId);
  }, [currentScenarioIndex]);

  useEffect(() => { const interval = setInterval(() => { if (Math.random() > 0.6) setAnomalyCount(prev => prev + 1); }, 3000); return () => clearInterval(interval); }, []);

  // 2. Потом условия выхода
  if (!mounted) return <StatsSkeleton />;

  return (
    <div className="relative min-h-screen font-sans overflow-hidden bg-dark">
      {/* Фоновая сетка */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/10 to-transparent blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8 pb-20 space-y-12 animate-fadeIn">
        
        {/* Терминал (System Logs) */}
        <SystemTerminal />
        
        {/* 1. HERO */}
        <div className="text-center relative z-10 mb-8">
            <GlitchTitle text="СТАТИСТИКА ПРОЕКТА" />
            <p className="text-lg text-light/60 mt-4 mb-6 flex items-center justify-center gap-2">
              <Activity className="w-5 h-5 text-red-500 animate-pulse" />
              Пульс коллективного бессознательного
            </p>
            <div className="w-full max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 bg-white/5 backdrop-blur-md border border-light/10 rounded-2xl mb-12 shadow-2xl divide-x divide-y md:divide-y-0 divide-light/10 overflow-hidden">
              
              {/* Эффекты */}
              <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2 mb-1 text-primary">
                  <Brain className="w-4 h-4" />
                  <span className="text-xl font-mono font-bold text-white">
                    {countEffects}
                  </span>
                </div>
                <div className="text-[10px] text-light/40 uppercase font-bold tracking-wider">Эффектов</div>
              </div>

              {/* Участники */}
              <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2 mb-1 text-blue-400">
                  <Users className="w-4 h-4" />
                  <span className="text-xl font-mono font-bold text-white">
                    {countParticipants}
                  </span>
                </div>
                <div className="text-[10px] text-light/40 uppercase font-bold tracking-wider">Участников</div>
              </div>

              {/* Голоса */}
              <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2 mb-1 text-yellow-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-xl font-mono font-bold text-white">
                    {countVotes}
                  </span>
                </div>
                <div className="text-[10px] text-light/40 uppercase font-bold tracking-wider">Голосов</div>
              </div>

              {/* Индекс сдвига */}
              <div className="p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
                <div className="flex items-center gap-2 mb-1 text-red-400 relative z-10">
                  <Activity className="w-4 h-4" />
                  <span className="text-xl font-mono font-bold text-white">
                    {globalStats.shiftIndex}%
                  </span>
                </div>
                <div className="text-[10px] text-red-400/60 uppercase font-bold tracking-wider relative z-10">Индекс Сдвига</div>
              </div>

            </div>
        </div>

        {/* 2. CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ядро Реальности */}
            <div className="bg-darkCard border border-light/10 rounded-3xl p-8 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-purple-400" /> Ядро Реальности</h2>
                        <p className="text-xs text-light/60">Глобальный уровень искажений</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-mono text-purple-400 animate-pulse">{anomalyCount}</div>
                        <div className="text-[10px] text-light/30 uppercase tracking-widest">DETECTED</div>
                    </div>
                </div>

                <div className="relative h-64 flex items-center justify-center">
                    {/* Орбиты (CSS animation) */}
                    <div className="absolute w-48 h-48 border-2 border-purple-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute w-56 h-56 border border-dashed border-purple-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                    <div className="absolute w-40 h-40 border-t-2 border-purple-400 rounded-full animate-[spin_3s_linear_infinite]" />
                    
                    {/* Само Ядро (Pie Chart упрощенный) */}
                    <div className="relative w-32 h-32">
                        <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                            {/* Фон */}
                            <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            {/* Прогресс (Мандела) */}
                            <path 
                              className="text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={`${globalStats.shiftIndex} 100`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">{globalStats.shiftIndex}%</span>
                            <span className="text-[9px] text-purple-300 uppercase tracking-widest">MANDELA</span>
                        </div>
                    </div>
                </div>
                
                {/* Легенда */}
                <div className="flex justify-center gap-8 mt-4 text-xs font-mono relative z-10">
                    <div className="flex items-center gap-2 text-purple-300"><span className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" /> ИСКАЖЕНИЕ</div>
                    <div className="flex items-center gap-2 text-light/40"><span className="w-2 h-2 bg-white/20 rounded-full" /> НОРМА</div>
                </div>
            </div>

            {/* Спектр Нестабильности */}
            <div className="bg-darkCard/80 backdrop-blur border border-light/10 rounded-3xl p-8 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-400" /> Спектр Нестабильности</h2>
                    <p className="text-sm text-light/60 mb-6">% эффекта Манделы по категориям</p>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={globalStats.categoryData} layout="vertical" margin={{ left: 0, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" hide domain={[0, 100]} />
                                <YAxis dataKey="slug" type="category" width={140} tick={<CustomYAxisTick />} axisLine={false} tickLine={false} />
                                <Bar 
                                  dataKey="percent" 
                                  radius={[2, 2, 2, 2]} 
                                  barSize={24} 
                                  isAnimationActive={false}
                                >
                                    {globalStats.categoryData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                    <LabelList 
                                      dataKey="percent" 
                                      position="right" 
                                      fill="#fff" 
                                      fontSize={11} 
                                      fontWeight="bold"
                                      formatter={(val: any) => `${val}%`} 
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>

        {/* 4. CONTROVERSIAL */}
        <section className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><AlertTriangle className="text-red-400" /> Самые спорные (50/50)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {globalStats.controversial.map((effect, index) => (
                    <Link href={`/effect/${effect.id}`} key={effect.id} className="group block">
                        <div className="bg-darkCard border border-light/10 rounded-2xl overflow-hidden hover:border-red-500/50 transition-colors h-full flex flex-col relative">
                            <div className="relative h-40 bg-black/20 glitch-wrapper">
                                {effect.imageUrl ? (
                                    <>
                                      <ImageWithSkeleton src={effect.imageUrl} alt={effect.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity relative z-[1]" />
                                      <div className="glitch-layers absolute inset-0 z-[2] opacity-0 group-hover:opacity-100 transition-opacity">
                                          <div className="glitch-layer" style={{ backgroundImage: `url('${effect.imageUrl.replace(/'/g, '%27')}')` }} />
                                          <div className="glitch-layer" style={{ backgroundImage: `url('${effect.imageUrl.replace(/'/g, '%27')}')` }} />
                                          <div className="glitch-layer" style={{ backgroundImage: `url('${effect.imageUrl.replace(/'/g, '%27')}')` }} />
                                      </div>
                                    </>
                                ) : <div className="w-full h-full flex items-center justify-center text-4xl">🖼️</div>}
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold border border-white/10">#{index + 1}</div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg text-light mb-2 line-clamp-2 group-hover:text-red-300 transition-colors">{effect.title}</h3>
                                <div className="mt-auto pt-4 border-t border-light/5">
                                    <div className="flex justify-between text-xs text-light/60 mb-1"><span>{Math.round(effect.percentA)}%</span><span>{Math.round(effect.percentB)}%</span></div>
                                    <div className="h-2 bg-dark rounded-full overflow-hidden flex"><div style={{ width: `${effect.percentA}%` }} className="bg-purple-500 h-full" /><div style={{ width: `${effect.percentB}%` }} className="bg-green-500 h-full" /></div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
      </div>
    </div>
  );
}
