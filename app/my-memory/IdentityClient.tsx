'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useReality } from '@/lib/context/RealityContext';
import { votesStore } from '@/lib/votes-store';
import { generateProfileText } from '@/lib/identity-modes';
import { Share2, Fingerprint, Activity, Cpu, Globe, Monitor, Wifi, Download, RefreshCw, Database, HardDrive, Zap } from 'lucide-react';
import RedactedText from '@/components/ui/RedactedText';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import HolographicRadar from '@/components/ui/HolographicRadar';
import { getUserCategoryStats } from '@/app/actions/user-stats';
import { getClientVisitorId } from '@/lib/client-visitor';

// Обновленный компонент метрики
const MinimalMetric = ({ label, value, icon: Icon, isUpsideDown, align = 'left', index = 0 }: any) => {
  const isRight = align === 'right';
  const colorClass = isUpsideDown ? 'text-red-500' : 'text-cyan-400';
  const textClass = isUpsideDown ? 'text-red-100' : 'text-blue-100';
  
  // Выбираем анимацию в зависимости от режима
  const animationClass = isUpsideDown 
    ? 'metric-pulse-glitch' 
    : 'metric-pulse-smooth';
    
  // Задержка зависит от позиции (индекса), чтобы совпадать с линией сканера
  // Линия сканера движется от 0% до 100% за 3 секунды (с alternate, значит туда-обратно = 6s полный цикл)
  // Метрики расположены с justify-between:
  // - index 0 (верх): ~15% высоты -> линия проходит в 0.45s (туда) и 5.55s (обратно)
  // - index 1 (середина): ~50% высоты -> линия проходит в 1.5s (туда) и 4.5s (обратно)
  // - index 2 (низ): ~85% высоты -> линия проходит в 2.55s (туда) и 3.45s (обратно)
  // Анимация метрики длится 6s, пик в начале (0%) и в конце (100%)
  // Задержка = время прохождения линии (для первого прохода туда)
  const delays = [0.45, 1.5, 2.55];
  const delayStyle = { 
    animationDelay: `${delays[index]}s`
  };

  return (
    <div 
      className={`flex items-center gap-3 my-4 ${isRight ? 'flex-row-reverse text-right' : 'flex-row text-left'} ${animationClass}`}
      style={delayStyle}
    >
      {/* Иконка */}
      <Icon className={`w-4 h-4 ${colorClass} opacity-80`} />
      
      {/* Текст */}
      <div className="flex flex-col">
        <span className={`text-[9px] font-mono uppercase tracking-widest opacity-50 ${textClass}`}>
          {label}
        </span>
        <span className={`text-xs font-bold font-mono tracking-wide ${textClass}`}>
          {value}
        </span>
      </div>
    </div>
  );
};

export default function IdentityClient() {
  const { isUpsideDown, voteCount } = useReality();
  const [profile, setProfile] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>({});
  const [liveMetrics, setLiveMetrics] = useState({ cpu: 12, ping: 45, memory: 30 });
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Состояние для данных графика
  const [chartData, setChartData] = useState<any[]>([
    { subject: 'Медиа', A: 0, fullMark: 100 },
    { subject: 'Бренды', A: 0, fullMark: 100 },
    { subject: 'СССР / РФ', A: 0, fullMark: 100 },
    { subject: 'Мир', A: 0, fullMark: 100 },
    { subject: 'Игры', A: 0, fullMark: 100 },
    { subject: 'Люди', A: 0, fullMark: 100 },
  ]);
  
  const cardRef = useRef<HTMLDivElement>(null);

  // Константы
  const REQUIRED_VOTES = 10;
  const progressPercent = Math.min((voteCount / REQUIRED_VOTES) * 100, 100);
  const isAnalysisReady = voteCount >= REQUIRED_VOTES;

  useEffect(() => {
    setMounted(true);
    setSystemInfo({
      ua: navigator.userAgent.includes('Win') ? 'WIN32' : 'UNIX',
      cores: navigator.hardwareConcurrency || 4,
      platform: navigator.platform.toUpperCase(),
      lang: navigator.language.toUpperCase(),
      screen: `${window.screen.width}x${window.screen.height}`
    });

    // Живые метрики и Глитч графика
    const interval = setInterval(() => {
      setLiveMetrics({
        cpu: Math.floor(Math.random() * 30) + 10,
        ping: Math.floor(Math.random() * 20) + 30,
        memory: Math.floor(Math.random() * 20) + 30
      });

      if (isUpsideDown) {
        setChartData(prev => prev.map(item => ({
          ...item,
          A: Math.min(100, Math.max(0, item.A + (Math.random() - 0.5) * 30))
        })));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isUpsideDown]);

  // Загрузка данных графика и восстановление после Изнанки
  useEffect(() => {
    if (!mounted) return;
    
    const loadData = async () => {
        // 1. Тексты профиля
        const votes = votesStore.get();
        const totalVoted = Object.keys(votes).length;
        const syncRate = Math.min(totalVoted * 2, 99); 
        const generated = generateProfileText(isUpsideDown, syncRate);
        setProfile(generated);

        // 2. Данные графика (если не в Изнанке, восстанавливаем реальные)
        if (!isUpsideDown) {
            const vid = getClientVisitorId();
            if (vid) {
                const stats = await getUserCategoryStats(vid);
                if (stats && stats.length > 0) {
                    setChartData(stats);
                }
            }
        }
    };

    loadData();
  }, [isUpsideDown, voteCount, mounted]);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    const toastId = toast.loading('Генерация слепка памяти...');

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: isUpsideDown ? '#050000' : '#1a1a1a',
        scale: 2,
        useCORS: true,
        logging: false
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `mandela-identity-${isUpsideDown ? 'glitch' : 'stable'}.png`;
      link.click();
      
      toast.success('Слепок сохранен', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Ошибка генерации', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-dark" />;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-dark pt-32 pb-20 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight uppercase text-white glitch-text" data-text="МОЯ ПАМЯТЬ">
            МОЯ <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isUpsideDown ? 'from-red-500 to-purple-600' : 'from-cyan-400 to-blue-600'}`}>ПАМЯТЬ</span>
          </h1>
        </motion.div>

        <motion.div 
          ref={cardRef} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`relative rounded-3xl overflow-hidden border transition-all duration-500 ${
            isUpsideDown 
                ? 'bg-black border-red-900/50 shadow-[0_0_50px_rgba(220,38,38,0.15)]' 
                : 'bg-darkCard border-white/10 shadow-2xl'
        }`}>
            
            {/* Header */}
            <div className={`flex justify-between items-center p-4 border-b ${isUpsideDown ? 'border-red-900/30 bg-red-950/20' : 'border-white/5 bg-white/5'}`}>
                <div className="flex items-center gap-2">
                    <Fingerprint className={`w-5 h-5 ${isUpsideDown ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
                    <span className="text-xs font-mono uppercase tracking-widest text-light/60">
                        ID: {isUpsideDown ? 'UNKNOWN_ENTITY_#ERR' : 'CITIZEN-7421'}
                    </span>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    isUpsideDown 
                        ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse' 
                        : 'bg-green-500/10 border-green-500/50 text-green-500'
                }`}>
                    {profile?.status || "ANALYZING..."}
                </div>
            </div>

            <div className="p-6 md:p-10">
                {!isAnalysisReady ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="text-center py-10"
                    >
                        <div className="mb-6 relative w-32 h-32 mx-auto">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                                <path className={`${isUpsideDown ? 'text-red-500' : 'text-blue-500'} transition-all duration-1000`} strokeDasharray={`${progressPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-2xl font-bold text-white">{voteCount}</span>
                                <span className="text-[10px] text-light/40 uppercase">из {REQUIRED_VOTES}</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Синхронизация...</h3>
                        <p className="text-light/60 text-sm max-w-md mx-auto">
                            Системе нужно больше данных. Проголосуйте еще в {REQUIRED_VOTES - voteCount} карточках.
                        </p>
                    </motion.div>
                ) : (
                    // GRID LAYOUT: 50% / 50%
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                        
                        {/* Левая колонка: Текст и Кнопка */}
                        <motion.div 
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                          className="flex flex-col justify-center"
                        >
                            <div className="mb-2 text-xs font-mono text-light/40 uppercase tracking-widest flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isUpsideDown ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                {isUpsideDown ? 'ОБНАРУЖЕН АРХЕТИП' : 'ПСИХОТИП ЛИЧНОСТИ'}
                            </div>
                            
                            <h2 className={`text-4xl md:text-5xl font-black mb-6 leading-none ${isUpsideDown ? 'text-stranger-red glitch-text' : 'text-white'}`} data-text={profile?.title}>
                                {profile?.title}
                            </h2>
                            
                            <div className={`p-6 rounded-xl border mb-8 relative overflow-hidden ${
                                isUpsideDown 
                                    ? 'bg-red-950/10 border-red-500/20 text-red-100' 
                                    : 'bg-blue-500/5 border-blue-500/20 text-blue-100'
                            }`}>
                                <RedactedText 
                                    text={profile?.description || ""} 
                                    className="text-lg leading-relaxed font-medium relative z-10"
                                />
                                {isUpsideDown && (
                                    <div className="absolute top-2 right-2 opacity-20 rotate-12 border-2 border-red-500 text-red-500 px-2 py-1 text-[10px] font-black uppercase tracking-widest">
                                        TOP SECRET
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleShare}
                                disabled={isGenerating}
                                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 ${
                                    isUpsideDown 
                                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
                                        : 'bg-white text-black hover:bg-gray-200 shadow-lg'
                                }`}
                            >
                                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                                {isGenerating ? 'ГЕНЕРАЦИЯ...' : 'СОХРАНИТЬ РЕЗУЛЬТАТ'}
                            </button>
                        </motion.div>

                        {/* Правая колонка: HUD График */}
                        <motion.div 
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                          className="relative h-[320px] flex items-center justify-center px-8"
                        >
                            
                            {/* Вертикальные линии сканера */}
                            <div className={`absolute top-4 bottom-4 left-0 w-[1px] ${isUpsideDown ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                                <div className={`absolute w-[2px] h-[10%] -left-[0.5px] box-content border-y ${
                                    isUpsideDown 
                                        ? 'bg-red-500 shadow-[0_0_15px_red] border-red-300 animate-scan-ragged' 
                                        : 'bg-cyan-400 shadow-[0_0_10px_cyan] border-white animate-scan-patrol'
                                }`} />
                            </div>
                            <div className={`absolute top-4 bottom-4 right-0 w-[1px] ${isUpsideDown ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                                <div className={`absolute w-[2px] h-[10%] -right-[0.5px] box-content border-y ${
                                    isUpsideDown 
                                        ? 'bg-red-500 shadow-[0_0_15px_red] border-red-300 animate-scan-ragged' 
                                        : 'bg-cyan-400 shadow-[0_0_10px_cyan] border-white animate-scan-patrol'
                                }`} style={{ animationDelay: '0.1s' }} />
                            </div>

                            {/* Левая колонка метрик (Передаем index) */}
                            <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-8 z-20">
                                <MinimalMetric index={0} label="CORES" value={`${systemInfo.cores} THREADS`} icon={Cpu} isUpsideDown={isUpsideDown} />
                                <MinimalMetric index={1} label="ENV" value={systemInfo.platform} icon={Monitor} isUpsideDown={isUpsideDown} />
                                <MinimalMetric index={2} label="LOCALE" value={systemInfo.lang} icon={Globe} isUpsideDown={isUpsideDown} />
                            </div>

                            {/* Правая колонка метрик (Передаем index) */}
                            <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-between py-8 z-20">
                                <MinimalMetric index={0} label="CPU" value={isUpsideDown ? 'ERR' : `${liveMetrics.cpu}%`} icon={Activity} isUpsideDown={isUpsideDown} align="right" />
                                <MinimalMetric index={1} label="PING" value={`${liveMetrics.ping}ms`} icon={Wifi} isUpsideDown={isUpsideDown} align="right" />
                                <MinimalMetric index={2} label="MEM" value={`${liveMetrics.memory}%`} icon={HardDrive} isUpsideDown={isUpsideDown} align="right" />
                            </div>

                            {/* График (HolographicRadar) */}
                            <div className="w-full h-full relative z-10 mx-16">
                                <HolographicRadar 
                                    data={chartData} 
                                    isUpsideDown={isUpsideDown} 
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Футер */}
            <div className={`p-4 border-t flex justify-between items-center ${isUpsideDown ? 'border-red-900/30 bg-red-950/30' : 'border-white/5 bg-white/5'}`}>
                <div className="text-[10px] font-mono text-light/40">
                    {isUpsideDown ? 'SYSTEM_FAILURE // REBOOT_REQUIRED' : 'SYSTEM_OPTIMAL // LOGGED'}
                </div>
                <div className="text-[10px] font-mono text-light/40">
                    v.2.4.0
                </div>
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
