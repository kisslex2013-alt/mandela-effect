'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateIdentity, getIdentityResult, type IdentityResultData, type UserAnswer } from '@/app/actions/generate-identity';
import { getEffectsByIds } from '@/app/actions/effects';
import { votesStore } from '@/lib/votes-store';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const QRCode = dynamic(() => import('react-qr-code').then(mod => mod.default), {
  ssr: false,
});
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,  } from 'recharts';
import toast from 'react-hot-toast';
import { Save, Share2, Archive, X, LogIn, Mail, Sparkles, Download, Copy, Loader2, Globe, Send, Instagram, MessageCircle, Brain } from 'lucide-react';
import { generateRealityID, generateArchetype, generateDescription, getThoughtOfDay } from '@/lib/identity-engine';
import { getVisitorId } from '@/lib/visitor';
import GlitchTitle from '@/components/ui/GlitchTitle';

const IdentitySkeleton = () => (
  <div className="min-h-screen bg-dark py-12 px-4 flex flex-col items-center">
    <div className="max-w-4xl w-full space-y-8">
      <div className="h-8 w-64 bg-white/5 rounded animate-pulse" />
      <div className="bg-darkCard/30 border border-light/5 rounded-3xl h-[500px] w-full animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>
      <div className="flex justify-center gap-4">
        <div className="h-12 w-32 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-12 w-32 bg-white/5 rounded-xl animate-pulse" />
      </div>
    </div>
  </div>
);

interface VotedEffect {
  id: string;
  title: string;
  category: string;
  userChoice: 'A' | 'B';
}

const REQUIRED_VOTES = 10;

// Конфигурация осей графика
const AXIS_GROUPS = [
  { label: 'СССР / РФ', keys: ['russian'] },
  { label: 'Медиа', keys: ['films', 'music', 'popculture', 'tv', 'games'] },
  { label: 'Бренды', keys: ['brands', 'food', 'shopping', 'cars'] },
  { label: 'Память', keys: ['childhood', 'people'] },
  { label: 'Мир', keys: ['geography', 'history', 'science', 'tech', 'space'] }
];

export default function IdentityClient() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<IdentityResultData | null>(null);
  const [votedEffects, setVotedEffects] = useState<VotedEffect[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [systemInfo, setSystemInfo] = useState({
    os: 'DETECTING...',
    cores: '0',
    memory: 'Unknown',
    resolution: '0x0',
    browser: 'Unknown',
    connection: 'OFFLINE',
    battery: 'AC_POWER',
    ping: '0ms',
    reactionTime: (0.4 + Math.random() * 0.8).toFixed(3) + 's'
  });
  const [realityID, setRealityID] = useState('Земля-1218');
  const [archetypeTitle, setArchetypeTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thought, setThought] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const voteCount = votedEffects.length;

  const loadData = useCallback(async () => {
    try {
      const votes = votesStore.get();
      const effectIds = Object.keys(votes);
      
      if (effectIds.length > 0) {
        const effectsRes = await getEffectsByIds(effectIds);
        if (effectsRes.success && effectsRes.data) {
          const mappedEffects: VotedEffect[] = effectsRes.data.map((eff: any) => ({
            id: eff.id,
            title: eff.title,
            category: eff.category,
            userChoice: votes[eff.id]
          }));
          setVotedEffects(mappedEffects);
        }
      } else {
        setVotedEffects([]);
      }

      const savedId = localStorage.getItem('identity_id');
      if (savedId) {
        const res = await getIdentityResult(savedId);
        if (res.success && res.data) {
          setResult(res.data as IdentityResultData);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleVotesUpdate = () => loadData();
    window.addEventListener('votes-updated', handleVotesUpdate);
    return () => window.removeEventListener('votes-updated', handleVotesUpdate);
  }, [loadData]);

  // Пересчет данных графика на основе реальных голосов
  useEffect(() => {
    if (votedEffects.length === 0) {
      // Если нет голосов, показываем нулевые значения
      setRadarData(
        AXIS_GROUPS.map(group => ({
          subject: group.label,
          A: 0,
          fullMark: 100
        }))
      );
      return;
    }

    // Подсчет "мандельности" по группам
    let totalMandelaCount = 0;
    let totalVotes = 0;
    const categoryCounts: Record<string, number> = {};

    const groupStats = AXIS_GROUPS.map(group => {
      let mandelaCount = 0;
      let totalCount = 0;

      votedEffects.forEach(effect => {
        // Проверяем, относится ли категория эффекта к этой группе
        if (group.keys.includes(effect.category.toLowerCase())) {
          totalCount++;
          totalVotes++;
          // Если пользователь выбрал вариант A (Мандела), увеличиваем счетчик
          if (effect.userChoice === 'A') {
            mandelaCount++;
            totalMandelaCount++;
          }
          // Подсчитываем категории для определения топовой
          const cat = effect.category.toLowerCase();
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
      });

      // Вычисляем процент "мандельности" (0-100)
      const percentage = totalCount > 0 ? Math.round((mandelaCount / totalCount) * 100) : 0;
      
      return {
        subject: group.label,
        A: Math.max(0, Math.min(100, percentage)), // Ограничиваем диапазон 0-100
        fullMark: 100
      };
    });

    setRadarData(groupStats);

      // Генерация данных архетипа
    if (totalVotes > 0) {
      // Используем syncRate из result, если он есть, иначе рассчитываем из голосов
      const matchPercentage = result?.syncRate ?? Math.round((totalMandelaCount / totalVotes) * 100);
      
      // Находим топовую категорию
      const topCategory = Object.keys(categoryCounts).length > 0 
        ? Object.entries(categoryCounts).reduce((a, b) => 
            categoryCounts[a[0]] > categoryCounts[b[0]] ? a : b
          )[0]
        : 'other';

      // Получаем visitorId и создаем seed
      const vid = getVisitorId();
      const seed = (vid || 'anonymous') + voteCount.toString();

      // Генерируем данные
      setRealityID(generateRealityID());
      setArchetypeTitle(generateArchetype(matchPercentage, topCategory, seed));
      setDescription(generateDescription(matchPercentage, topCategory, seed));
      setThought(getThoughtOfDay(matchPercentage, topCategory, seed));
    } else if (result) {
      // Если есть result, но нет голосов, используем данные из result
      const matchPercentage = result.syncRate || 50;
      
      // Получаем visitorId и создаем seed
      const vid = getVisitorId();
      const seed = (vid || 'anonymous') + voteCount.toString();
      
      setRealityID(generateRealityID());
      setArchetypeTitle(generateArchetype(matchPercentage, 'other', seed));
      setDescription(generateDescription(matchPercentage, 'other', seed));
      setThought(getThoughtOfDay(matchPercentage, 'other', seed));
    }
  }, [votedEffects, result]);

  // Эффект для сбора данных о браузере
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nav = navigator as any;
    
    // 1. ОС и Браузер
    const platform = nav.platform || 'Unknown OS';
    const userAgent = nav.userAgent;
    const browserName = userAgent.includes('Chrome') ? 'Chrome_Engine' : 
                        userAgent.includes('Firefox') ? 'Quantum_Core' : 
                        userAgent.includes('Safari') ? 'Webkit_Node' : 'Unknown_Agent';

    // 2. Железо
    const cores = nav.hardwareConcurrency ? `${nav.hardwareConcurrency} THREADS` : '4 THREADS';
    const ram = nav.deviceMemory ? `~${nav.deviceMemory} GB` : 'ALLOCATED';
    const res = `${window.screen.width}x${window.screen.height}`;

    // 3. Сеть (примерная)
    const conn = nav.connection ? (nav.connection.effectiveType || '4g').toUpperCase() : 'SECURE_LINK';

    // 4. Батарея (асинхронно)
    let batLevel = 'EXTERNAL_PWR';
    if (nav.getBattery) {
        nav.getBattery().then((b: any) => {
            const level = Math.round(b.level * 100);
            setSystemInfo(prev => ({...prev, battery: `${level}% [${b.charging ? 'CHARGING' : 'DRAINING'}]`}));
        }).catch(() => {});
    }

    // 5. Пинг (симуляция живого соединения)
    const interval = setInterval(() => {
        const ping = Math.floor(Math.random() * 40) + 15;
        setSystemInfo(prev => ({...prev, ping: `${ping}ms`}));
    }, 2000);

    // 6. Таймер сессии
    const timer = setInterval(() => setSessionTime(t => t + 1), 1000);

    setSystemInfo({
        os: platform.toUpperCase().replace(/ /g, '_'),
        cores,
        memory: ram,
        resolution: res,
        browser: browserName.toUpperCase(),
        connection: `${conn}_ENCRYPTED`,
        battery: batLevel,
        ping: '24ms',
        reactionTime: (0.4 + Math.random() * 0.8).toFixed(3) + 's'
    });

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      if (votedEffects.length === 0) return;

      const answers: UserAnswer[] = votedEffects.map(eff => ({
        effectId: eff.id,
        title: eff.title,
        category: eff.category,
        selectedVariant: eff.userChoice,
        isMandela: eff.userChoice === 'A'
      }));

      const res = await generateIdentity(answers);
      if (res.success && res.data) {
        setResult(res.data);
        localStorage.setItem('identity_id', res.data.id);
        toast.success('Личность синхронизирована!');
      } else {
        toast.error(res.error || 'Ошибка генерации');
      }
    } catch (e) {
      toast.error('Произошла ошибка');
    } finally {
      setGenerating(false);
    }
  };

  const resetIdentity = () => {
    if (confirm('Стереть все данные (паспорт и голоса) и начать заново?')) {
      localStorage.removeItem('identity_id');
      votesStore.clear();
      setResult(null);
      setVotedEffects([]);
      toast.success('Память очищена');
    }
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById('identity-card-node');
    if (!element) return;

    setIsGeneratingImage(true);
    try {
      // Динамический импорт для Next.js
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#111',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `mandela-identity-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Карточка сохранена!');
    } catch (e) {
      console.error(e);
      toast.error('Не удалось создать картинку');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyLink = () => {
    if (!result) return;
    const url = `${window.location.origin}/share/${result.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Ссылка скопирована');
  };

  if (loading) return <IdentitySkeleton />;

  const isReady = voteCount >= REQUIRED_VOTES;

  return (
    <div className="min-h-screen bg-dark pt-32 pb-8 px-4 flex flex-col items-center relative">
      {/* Фоновая сетка и цветовые пятна */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] opacity-30" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full relative z-10"
      >
      {/* Заголовок страницы */}
      <div className="text-center mb-8">
        <GlitchTitle text="МОЯ ПАМЯТЬ" />
      </div>

      {/* Состояние: Результат (ПАСПОРТ) */}
      {result ? (
        <div className="w-full fade-in-section is-visible">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                ID Хроно-Путешественника
              </h1>
              
              {/* Компактный бейдж гостя (заглушка на будущий функционал) */}
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-500 hover:bg-yellow-500/20 transition-all group"
                title="Нажмите, чтобы войти и сохранить прогресс"
              >
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Гость</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={resetIdentity} className="px-3 py-1 bg-red-500/10 border border-red-500/50 text-red-400 rounded hover:bg-red-500/20 transition-all text-xs font-mono uppercase tracking-wider">
                [СБРОСИТЬ ID]
              </button>
            </div>
          </div>

          <div id="identity-card-node" className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-darkCard/80 border border-light/10 rounded-3xl p-8 relative overflow-hidden mb-12">
            {/* Декоративные уголки */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary/50 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary/50 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary/50 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary/50 rounded-br-lg" />

            {/* Левая колонка: Текст */}
            <div className="lg:col-span-1 flex flex-col space-y-4">
              <div className="text-light/40 text-xs font-mono mb-2">АРХЕТИП ЛИЧНОСТИ</div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight tracking-tighter glitch-text" data-text={archetypeTitle || result.archetype}>{archetypeTitle || result.archetype}</h2>
              <div className="bg-light/5 rounded-xl p-4 border border-light/5">
                <p className="text-light/80 italic leading-relaxed">"{description || result.description}"</p>
              </div>
              
              <div className="mt-auto space-y-6">
                {/* Мысль дня */}
                <div>
                  <div className="text-light/40 text-[10px] uppercase tracking-widest mb-2">МЫСЛЬ ДНЯ</div>
                  <div className="border-l-2 border-blue-500 pl-4 py-1">
                    <p className="text-sm text-light/80 italic leading-relaxed">
                      "{thought || result.quote}"
                    </p>
                  </div>
                </div>

                {/* QR Код (Внизу) */}
                <div className="pt-6">
                  <div className="text-light/30 text-[10px] uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                    <span className="w-1 h-1 bg-cyan-500 rounded-full animate-ping" />
                    ACCESS_KEY
                  </div>
                  
                  <div className="relative group cursor-pointer w-fit">
                    {/* Декоративная рамка */}
                    <div className="absolute -inset-2 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm group-hover:border-cyan-500/30 transition-colors" />
                    
                    {/* Сам QR код */}
                    <div className="relative bg-dark p-2 rounded-lg border border-white/5 group-hover:animate-pulse">
                      <div className="[&_svg_path]:fill-cyan-400 [&_svg_rect]:fill-transparent">
                        <QRCode 
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${result.id}`}
                          size={100}
                          level="H"
                          bgColor="transparent"
                          fgColor="#22d3ee"
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                          viewBox="0 0 256 256"
                        />
                      </div>
                      
                      {/* Иконка в центре (поверх) */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 bg-dark rounded-full flex items-center justify-center border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                          <Brain className="w-4 h-4 text-cyan-400" />
                        </div>
                      </div>
                    </div>

                    {/* Глитч-эффект при наведении */}
                    <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity mix-blend-overlay rounded-lg pointer-events-none" />
                  </div>
                  
                  <div className="text-[9px] text-light/20 mt-2 font-mono">
                    SCAN TO SYNC TIMELINE
                  </div>
                </div>
              </div>
            </div>

            {/* Центральная колонка: График */}
            <div className="lg:col-span-1 flex flex-col items-center relative">
              {/* 1. Проценты (Перенесено) */}
              <div className="text-center w-full mb-2 mt-6">
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className={`text-6xl font-black tracking-tighter ${result.syncRate > 50 ? 'text-green-400' : 'text-purple-400'}`}>{result.syncRate}%</span>
                  <span className="text-light/60 text-sm uppercase tracking-widest pb-2">ИНДЕКС СДВИГА</span>
                </div>
                <div className="h-2 bg-dark/50 rounded-full mt-2 overflow-hidden w-full max-w-[200px] mx-auto">
                  <motion.div 
                    className={`h-full ${result.syncRate > 50 ? 'bg-green-400' : 'bg-purple-400'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.syncRate}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <p className="text-xs text-light/40 mt-2 font-mono">Текущая реальность: {realityID}</p>
              </div>

              {/* 2. График */}
              <div className="flex-1 w-full flex items-center justify-center relative min-h-[300px] -mt-16">
                {/* Фоновое свечение */}
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                <div className="w-full h-64 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData.length > 0 ? radarData : AXIS_GROUPS.map(group => ({ subject: group.label, A: 0, fullMark: 100 }))}>
                      <defs>
                        <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        </linearGradient>
                        <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <PolarGrid stroke="rgba(255,255,255,0.15)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Memory" dataKey="A" stroke="#22d3ee" strokeWidth={3} fill="url(#radarFill)" fillOpacity={1} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Штамп (Цифровой стиль) */}
              {result.syncRate <= 80 && (
                <div className="absolute bottom-16 -right-2 transform -rotate-12 z-20 pointer-events-none">
                  <div className="border border-red-500/80 bg-red-500/10 px-6 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2 animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <span className="font-mono font-bold text-red-500 tracking-[0.25em] text-lg">
                      ANOMALY_DETECTED
                    </span>
                  </div>
                  {/* Декоративные линии штампа */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-l border-t border-red-500" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r border-b border-red-500" />
                </div>
              )}
              {result.syncRate > 80 && (
                <div className="absolute bottom-16 -right-2 transform -rotate-12 z-20 pointer-events-none">
                  <div className="border border-green-500/80 bg-green-500/10 px-6 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="font-mono font-bold text-green-500 tracking-[0.25em] text-lg">
                      VERIFIED
                    </span>
                  </div>
                  {/* Декоративные линии штампа */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-l border-t border-green-500" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r border-b border-green-500" />
                </div>
              )}
            </div>

            {/* Правая колонка: Реальные данные */}
            <div className="lg:col-span-1 bg-black/20 rounded-xl p-6 border border-white/5 font-mono text-xs flex flex-col justify-between h-full min-h-[300px]">
              
              <div>
                  <div className="text-light/40 mb-4 border-b border-white/5 pb-2 flex justify-between items-center">
                     <span>СИСТЕМНЫЕ_МЕТРИКИ</span>
                     <span className="text-green-500 animate-pulse">● LIVE</span>
                  </div>
                  
                  {/* Блок 1: Хост */}
                  <div className="space-y-3 mb-6">
                     <div className="flex justify-between">
                        <span className="text-light/50">СРЕДА_ОБИТАНИЯ:</span>
                        <span className="text-primary font-bold">{systemInfo.os}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-light/50">АГЕНТ_ДОСТУПА:</span>
                        <span className="text-light">{systemInfo.browser}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-light/50">РАЗРЕШЕНИЕ_СЕТЧАТКИ:</span>
                        <span className="text-light">{systemInfo.resolution}</span>
                     </div>
                  </div>

                  <div className="h-px bg-white/5 my-4" />

                  {/* Блок 2: Ресурсы */}
                  <div className="space-y-3 mb-6">
                     <div className="flex justify-between">
                        <span className="text-light/50">МОЩНОСТЬ_УЗЛА:</span>
                        <span className="text-yellow-400">{systemInfo.cores}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-light/50">ОБЪЕМ_КЭША:</span>
                        <span className="text-yellow-400">{systemInfo.memory}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-light/50">ЭНЕРГИЯ_МОДУЛЯ:</span>
                        <span className={systemInfo.battery.includes('CHARGING') ? 'text-green-400' : 'text-orange-400'}>
                            {systemInfo.battery}
                        </span>
                     </div>
                  </div>

                  <div className="h-px bg-white/5 my-4" />

                  {/* Блок 3: Сеть */}
                  <div className="space-y-3 mb-6">
                     <div className="flex justify-between">
                        <span className="text-light/50">ТИП_СВЯЗИ:</span>
                        <span className="text-blue-400">{systemInfo.connection}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-light/50">ЗАДЕРЖКА_СИГНАЛА:</span>
                        <span className="text-green-400 font-bold">{systemInfo.ping}</span>
                     </div>
                  </div>

                  <div className="h-px bg-white/5 my-4" />

                  {/* Блок 4: Биометрия (Новый) */}
                  <div className="space-y-3">
                     <div className="text-light/40 mb-2 text-[10px] uppercase tracking-widest">БИОМЕТРИЯ_СЕССИИ</div>
                     
                     <div className="flex justify-between">
                        <span className="text-light/50">ВРЕМЯ_СЕССИИ:</span>
                        <span className="text-white font-mono">
                          {new Date(sessionTime * 1000).toISOString().substr(14, 5)}
                        </span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-light/50">СКОРОСТЬ_РЕАКЦИИ:</span>
                        <span className="text-purple-400">~{systemInfo.reactionTime || 'CALCULATING...'}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-light/50">КОГНИТИВНАЯ_НАГРУЗКА:</span>
                        <span className="text-blue-400 animate-pulse">АКТИВНА</span>
                     </div>
                  </div>
              </div>
              
              {/* Логи в самом низу */}
              <div className="mt-6 pt-4 border-t border-white/10 space-y-1 opacity-70 text-[10px]">
                 <div className="text-light/30 mb-1">ЖУРНАЛ_СИНХРОНИЗАЦИИ:</div>
                 <div className="text-green-500/70">{'>'} Анализ паттернов... OK</div>
                 <div className="text-green-500/70">{'>'} Сборка профиля... OK</div>
                 <div className="text-blue-400/70 animate-pulse">{'>'} Рендер интерфейса...</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-16">
             <Link href="/catalog" className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-light transition-colors border border-light/5">← В каталог</Link>
             <button onClick={() => setIsShareModalOpen(true)} className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl transition-colors font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Поделиться результатом
             </button>
          </div>
        </div>
      ) : (
        /* Состояние: КАЛИБРОВКА */
        <div className="max-w-2xl mx-auto bg-darkCard/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden text-center">
          {/* Декоративные сканеры */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <div className="mb-6 relative inline-block">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            {/* Вращающееся кольцо */}
            <div className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-full animate-spin-slow" />
          </div>

          <h2 className="text-3xl font-black text-white mb-2">СИНХРОНИЗАЦИЯ</h2>
          <p className="text-light/50 mb-8 max-w-md mx-auto">
            Системе нужно больше данных. Проанализировано {voteCount} из {REQUIRED_VOTES} необходимых паттернов.
          </p>

          {/* Прогресс бар в стиле терминала */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-mono text-primary mb-2">
              <span>LOADING_DATA...</span>
              <span>{(voteCount / REQUIRED_VOTES * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${(voteCount / REQUIRED_VOTES) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          {isReady ? (
            <button onClick={handleGenerate} disabled={generating} className="btn-glitch px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
              {generating ? <span className="animate-pulse">Синхронизация...</span> : <>Синхронизировать Личность ⚡</>}
            </button>
          ) : (
            <Link href="/catalog" className="inline-block">
              <div className="btn-glitch px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                Продолжить сканирование ⚡
              </div>
            </Link>
          )}
        </div>
      )}

      {/* АРХИВ НАБЛЮДЕНИЙ */}
      {votedEffects.length > 0 && (
        <div className="w-full mt-8">
          <div className="flex items-center gap-2 mb-6 opacity-60">
            <Archive className="w-5 h-5" />
            <h3 className="text-lg font-bold text-light tracking-wide uppercase">Архив Наблюдений</h3>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-light/50">{votedEffects.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {votedEffects.map((effect) => (
              <Link href={`/effect/${effect.id}`} key={effect.id} className="group bg-darkCard/50 border border-light/5 hover:border-light/20 p-4 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-medium text-light group-hover:text-cyan-400 transition-colors line-clamp-2">{effect.title}</h4>
                  <p className="text-xs text-light/40 mt-1">{effect.category}</p>
                </div>
                <div className={`shrink-0 px-2 py-1 rounded text-xs font-bold ${effect.userChoice === 'A' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                  {effect.userChoice === 'A' ? 'МАНДЕЛА' : 'РЕАЛЬНОСТЬ'}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* МОДАЛКА ЛОГИНА */}
      <AnimatePresence>
        {showLoginModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-darkCard border border-light/10 rounded-2xl p-8 max-w-sm w-full relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-light/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                  🔐
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Вход в Сингулярность</h3>
                <p className="text-sm text-light/50">
                  Сохраните свой прогресс и историю голосования навсегда.
                </p>
              </div>

              <div className="space-y-3">
                {/* Yandex */}
                <button 
                  onClick={() => toast('Вход через Яндекс в разработке 🚧', { icon: '🛠️' })}
                  className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-light/10 rounded-xl flex items-center gap-3 transition-all group"
                >
                  <span className="text-red-500 font-bold group-hover:scale-110 transition-transform">Я</span>
                  <span className="text-sm font-medium text-light">Войти через Яндекс</span>
                </button>

                {/* Google */}
                <button 
                  onClick={() => toast('Вход через Google в разработке 🚧', { icon: '🛠️' })}
                  className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-light/10 rounded-xl flex items-center gap-3 transition-all group"
                >
                  <span className="text-blue-500 font-bold group-hover:scale-110 transition-transform">G</span>
                  <span className="text-sm font-medium text-light">Войти через Google</span>
                </button>

                {/* Email */}
                <button 
                  onClick={() => toast('Вход через почту в разработке 🚧', { icon: '🛠️' })}
                  className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-light/10 rounded-xl flex items-center gap-3 transition-all group"
                >
                  <span className="text-light/50 group-hover:text-white transition-colors">✉️</span>
                  <span className="text-sm font-medium text-light">Войти через Email</span>
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-light/5 text-center">
                <p className="text-xs text-light/30">
                  Функционал личных кабинетов находится на стадии бета-тестирования.
                </p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* МОДАЛКА ШЕРИНГА */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" 
            onClick={() => setIsShareModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-darkCard border border-light/10 rounded-2xl p-6 max-w-md w-full relative shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setIsShareModalOpen(false)} className="absolute top-4 right-4 text-light/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" /> Поделиться профилем
              </h3>
              <p className="text-sm text-light/50 mb-6">Расскажи другим, из какой ты реальности.</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Telegram */}
                <button 
                  onClick={() => {
                    const url = result ? `${window.location.origin}/share/${result.id}` : window.location.href;
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Мой архетип в Эффекте Манделы: ' + (archetypeTitle || result?.archetype || ''))}`, '_blank');
                  }} 
                  className="p-3 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] rounded-xl flex flex-col items-center gap-2 transition-colors font-medium text-sm border border-[#229ED9]/20"
                >
                  <Send className="w-6 h-6" /> Telegram
                </button>
                
                {/* VKontakte */}
                <button 
                  onClick={() => {
                    const url = result ? `${window.location.origin}/share/${result.id}` : window.location.href;
                    window.open(`https://vk.com/share.php?url=${encodeURIComponent(url)}`, '_blank');
                  }} 
                  className="p-3 bg-[#0077FF]/10 hover:bg-[#0077FF]/20 text-[#0077FF] rounded-xl flex flex-col items-center gap-2 transition-colors font-medium text-sm border border-[#0077FF]/20"
                >
                  <Globe className="w-6 h-6" /> VKontakte
                </button>

                {/* WhatsApp */}
                <button 
                  onClick={() => {
                    const url = result ? `${window.location.origin}/share/${result.id}` : window.location.href;
                    window.open(`https://wa.me/?text=${encodeURIComponent('Мой архетип: ' + (archetypeTitle || result?.archetype || '') + ' ' + url)}`, '_blank');
                  }} 
                  className="p-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl flex flex-col items-center gap-2 transition-colors font-medium text-sm border border-[#25D366]/20"
                >
                  <MessageCircle className="w-6 h-6" /> WhatsApp
                </button>

                {/* Instagram */}
                <button 
                  onClick={() => {
                    const url = result ? `${window.location.origin}/share/${result.id}` : window.location.href;
                    navigator.clipboard.writeText(url);
                    toast.success('Ссылка скопирована для Instagram');
                    window.open('https://instagram.com', '_blank');
                  }} 
                  className="p-3 bg-[#E1306C]/10 hover:bg-[#E1306C]/20 text-[#E1306C] rounded-xl flex flex-col items-center gap-2 transition-colors font-medium text-sm border border-[#E1306C]/20"
                >
                  <Instagram className="w-6 h-6" /> Instagram
                </button>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={handleDownloadImage} 
                  disabled={isGeneratingImage} 
                  className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 text-light transition-colors border border-light/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Скачать карточку</span>
                </button>
                <button 
                  onClick={handleCopyLink} 
                  className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 text-light transition-colors border border-light/10"
                >
                  <Copy className="w-4 h-4" />
                  <span>Скопировать ссылку</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}
