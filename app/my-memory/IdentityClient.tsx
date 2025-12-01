'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateIdentity, getIdentityResult, type IdentityResultData, type UserAnswer } from '@/app/actions/generate-identity';
import { getEffectsByIds } from '@/app/actions/effects';
import { votesStore } from '@/lib/votes-store';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,  } from 'recharts';
import toast from 'react-hot-toast';
import { Save, Share2, Archive, X, LogIn, Mail } from 'lucide-react';

interface VotedEffect {
  id: string;
  title: string;
  category: string;
  userChoice: 'A' | 'B';
}

export default function IdentityClient() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<IdentityResultData | null>(null);
  const [votedEffects, setVotedEffects] = useState<VotedEffect[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);

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
          prepareRadarData(res.data.stats);
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

  const prepareRadarData = (stats: any) => {
    const baseVal = stats.syncRate || 50;
    setRadarData([
      { subject: 'Кино', A: Math.min(100, Math.max(20, baseVal + Math.random() * 30 - 15)), fullMark: 100 },
      { subject: 'Бренды', A: Math.min(100, Math.max(20, 100 - baseVal)), fullMark: 100 },
      { subject: 'История', A: Math.min(100, Math.max(20, baseVal - 10)), fullMark: 100 },
      { subject: 'География', A: Math.min(100, Math.max(20, 100 - baseVal + 10)), fullMark: 100 },
      { subject: 'Техно', A: Math.min(100, Math.max(20, baseVal)), fullMark: 100 },
    ]);
  };

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
        prepareRadarData(res.data.stats);
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

  const handleShare = async () => {
    if (!result) return;

    const url = `${window.location.origin}/share/${result.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Мой Паспорт Реальности',
          text: `Я — ${result.archetype}. А ты из какой вселенной?`,
          url: url,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована!');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-cyan-400 animate-pulse">Инициализация протокола...</div>;

  const isReady = voteCount >= 10;

  return (
    <div className="min-h-screen bg-dark py-8 px-4 flex flex-col items-center">
      
      {/* ПЛАШКА ЛОГИНА */}
      <div className="w-full max-w-4xl mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Save className="w-6 h-6 text-yellow-300 shrink-0" />
          <div>
            <h4 className="text-yellow-200 font-bold text-sm">Временная сессия</h4>
            <p className="text-yellow-200/60 text-xs">Ваш ID и история хранятся только в этом браузере. Войдите, чтобы сохранить их навсегда.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowLoginModal(true)}
          className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          Войти в систему
        </button>
      </div>

      {/* Состояние: Результат (ПАСПОРТ) */}
      {result ? (
        <div className="max-w-4xl w-full fade-in-section is-visible">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
              ID Хроно-Путешественника
            </h1>
            <button onClick={resetIdentity} className="px-3 py-1 bg-red-500/10 border border-red-500/50 text-red-400 rounded hover:bg-red-500/20 transition-all text-xs font-mono uppercase tracking-wider">
              [СБРОСИТЬ ID]
            </button>
          </div>

          <div className="bg-darkCard/50 backdrop-blur-xl border border-light/10 rounded-3xl overflow-hidden relative shadow-2xl shadow-purple-900/20 mb-12">
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 border-b md:border-b-0 md:border-r border-light/10 relative">
                 <div className={`absolute top-4 right-4 border-4 transform rotate-12 px-3 py-1 font-black text-xl opacity-80 tracking-widest ${result.syncRate > 80 ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                   {result.syncRate > 80 ? 'VERIFIED' : 'ANOMALY'}
                 </div>
                 <div className="text-light/40 text-xs font-mono mb-2">АРХЕТИП ЛИЧНОСТИ</div>
                 <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight glitch-text" data-text={result.archetype}>{result.archetype}</h2>
                 <div className="mb-8">
                   <div className="flex items-end gap-2 mb-2">
                     <span className={`text-6xl font-bold ${result.syncRate > 50 ? 'text-green-400' : 'text-purple-400'}`}>{result.syncRate}%</span>
                     <span className="text-light/60 pb-2">синхронизации</span>
                   </div>
                   <div className="w-full bg-dark/50 h-2 rounded-full overflow-hidden">
                     <div className={`h-full ${result.syncRate > 50 ? 'bg-green-400' : 'bg-purple-400'}`} style={{ width: `${result.syncRate}%` }} />
                   </div>
                   <p className="text-xs text-light/40 mt-2 font-mono">Текущая реальность: Земля-1218</p>
                 </div>
                 <div className="bg-light/5 rounded-xl p-4 border border-light/5">
                   <p className="text-light/80 italic leading-relaxed">"{result.description}"</p>
                 </div>
              </div>

              <div className="p-8 flex flex-col items-center justify-center bg-black/20 relative overflow-hidden">
                <div className="w-full h-64 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
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
                <div className="w-full flex items-end justify-between mt-auto gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-light/30 mb-1">МЫСЛЬ ДНЯ</div>
                    <blockquote className="text-xs text-light/60 border-l-2 border-primary pl-2">{result.quote}</blockquote>
                  </div>
                  <div className="bg-white p-2 rounded-lg shrink-0">
                    <QRCode value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${result.id}`} size={64} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-16">
             <Link href="/catalog" className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-light transition-colors border border-light/5">← В каталог</Link>
             <button onClick={handleShare} className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl transition-colors font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Поделиться результатом
             </button>
          </div>
        </div>
      ) : (
        /* Состояние: КАЛИБРОВКА (без изменений) */
        <div className="max-w-2xl w-full text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-darkCard border border-light/10 p-12 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-50 ${isReady ? 'from-green-400 via-cyan-500 to-green-400' : 'from-transparent via-purple-500 to-transparent'}`}></div>
            <div className="text-6xl mb-6 transform transition-transform hover:scale-110 duration-500">{isReady ? '✨' : '🧬'}</div>
            <h1 className="text-3xl font-bold text-white mb-2">Инициализация Личности</h1>
            <p className="text-light/60 mb-8 min-h-[3rem]">{isReady ? "Анализ завершен. Данные собраны. Система готова к построению вашего профиля реальности." : "Системе недостаточно данных для определения вашего происхождения в Мультивселенной. Необходимо проанализировать минимум 10 воспоминаний."}</p>
            <div className="mb-8 max-w-sm mx-auto">
              <div className="flex justify-between text-sm mb-2">
                <span className={isReady ? "text-green-400 font-bold" : "text-cyan-400"}>{isReady ? "Готовность 100%" : "Сбор данных..."}</span>
                <span className="text-light">{voteCount} / 10</span>
              </div>
              <div className="h-4 bg-dark rounded-full overflow-hidden border border-light/10 relative">
                <div className={`h-full transition-all duration-1000 ${isReady ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-blue-600'}`} style={{ width: `${Math.min((voteCount / 10) * 100, 100)}%` }} />
              </div>
            </div>
            {isReady ? (
              <button onClick={handleGenerate} disabled={generating} className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xl rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2">
                {generating ? <span className="animate-pulse">Синхронизация...</span> : <>Синхронизировать Личность ⚡</>}
              </button>
            ) : (
              <Link href="/catalog" className="inline-block w-full py-4 bg-white/5 hover:bg-white/10 text-light font-medium rounded-xl transition-colors border border-light/5 hover:border-light/20">Перейти в каталог (осталось: {10 - voteCount})</Link>
            )}
          </motion.div>
        </div>
      )}

      {/* АРХИВ НАБЛЮДЕНИЙ */}
      {votedEffects.length > 0 && (
        <div className="max-w-4xl w-full mt-8">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLoginModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-darkCard w-full max-w-md rounded-2xl border border-light/10 shadow-2xl p-8 relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-light/40 hover:text-light"><X className="w-5 h-5" /></button>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-primary to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <LogIn className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Авторизация</h2>
                <p className="text-light/60">Сохраните свой паспорт реальности и историю голосований навсегда.</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => toast('Скоро будет доступно!')} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Войти через Google
                </button>
                <button onClick={() => toast('Скоро будет доступно!')} className="w-full py-3 bg-[#FC3F1D] text-white font-bold rounded-xl hover:bg-[#E63515] transition-colors flex items-center justify-center gap-2">
                  <span className="font-serif">Я</span> Войти через Яндекс
                </button>
                <button onClick={() => toast('Скоро будет доступно!')} className="w-full py-3 bg-white/5 text-light font-bold rounded-xl hover:bg-white/10 transition-colors border border-light/10 flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5" /> Войти через Email
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
