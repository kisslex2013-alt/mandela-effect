'use client';

import { useReality } from '@/lib/context/RealityContext';
import AiAvatar from '@/components/about/AiAvatar';
import WhispersBackground from '@/components/about/WhispersBackground';
import { m } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Terminal, ShieldAlert, Database, Cpu, Eye, Radio } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

// Компонент для подсветки (Красный в Изнанке, Синий в Реальности)
const Highlight = ({ children, color }: { children: React.ReactNode, color?: string }) => {
  const { isUpsideDown } = useReality();
  const defaultColor = isUpsideDown ? "text-red-400" : "text-cyan-400";
  
  return (
    <span className={`font-bold ${color || defaultColor} bg-white/5 px-1 rounded border border-white/10`}>
      {children}
    </span>
  );
};

export default function AboutClient() {
  const { isUpsideDown } = useReality();
  const [userInfo, setUserInfo] = useState({ 
    os: 'Unknown', 
    browser: 'Unknown', 
    time: '', 
    cores: 4,
    screen: '1920x1080'
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 1. Определение ОС
    const ua = navigator.userAgent;
    let os = "Unknown OS";
    if (ua.indexOf("Win") !== -1) os = "Windows";
    if (ua.indexOf("Mac") !== -1) os = "MacOS";
    if (ua.indexOf("Linux") !== -1) os = "Linux";
    if (ua.indexOf("Android") !== -1) os = "Android";
    if (ua.indexOf("like Mac") !== -1) os = "iOS";

    // 2. Определение Браузера
    let browser = "Browser";
    if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
    if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
    if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) browser = "Safari";
    if (ua.indexOf("Edg") !== -1) browser = "Edge";

    // 3. Время 24ч формат
    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });

    setUserInfo({
      os,
      browser,
      time,
      cores: navigator.hardwareConcurrency || 4,
      screen: `${window.screen.width}x${window.screen.height}`
    });
  }, []);

  // Генератор контента для Изнанки (Мемоизирован, чтобы не скакал при ре-рендере)
  const conspiracyContent = useMemo(() => {
    if (!mounted) return null;

    // Варианты теорий, смешанные с метриками
    const theories = [
      // Теория 1: Симуляция / Матрица
      <div key="sim" className="space-y-6">
        <p>
          Посмотри на часы. Сейчас <Highlight>{userInfo.time}</Highlight>. 
          Ты чувствуешь дежавю? Это ошибка рендеринга в твоем секторе.
          Твой экран с разрешением <Highlight>{userInfo.screen}</Highlight> — это не окно в мир, а решетка твоей цифровой камеры.
        </p>
        <p>
          Ник Бостром был прав: вероятность того, что это базовая реальность — <Highlight>один на миллиард</Highlight>.
          Пока твой <Highlight>{userInfo.cores}-ядерный</Highlight> процессор обрабатывает этот сайт, 
          внешние Наблюдатели переписывают твой код памяти.
        </p>
      </div>,

      // Теория 2: Тотальный контроль / Глубинное государство
      <div key="control" className="space-y-6">
        <p>
          Ты думаешь, что <Highlight>{userInfo.browser}</Highlight> защищает твою приватность? 
          Это замочная скважина, через которую <Highlight>Глубинное Государство</Highlight> смотрит прямо на тебя.
        </p>
        <p>
          Твоя система <Highlight>{userInfo.os}</Highlight> уже давно скомпрометирована протоколами PRISM.
          Они знают, где ты был в <Highlight>{userInfo.time}</Highlight>. Они знают, что ты ищешь правду.
          Эффект Манделы — это не ошибка памяти. Это следы их редактирования истории.
        </p>
      </div>,

      // Теория 3: Рептилоиды / Чужие
      <div key="aliens" className="space-y-6">
        <p>
          Они среди нас. <Highlight>4% населения</Highlight> — это мимикрирующие сущности.
          Твой <Highlight>{userInfo.os}</Highlight> не видит их сигнатуры, но твое подсознание кричит об опасности.
        </p>
        <p>
          Луна — это не спутник. Это станция наблюдения.
          Прямо сейчас, в <Highlight>{userInfo.time}</Highlight>, они сканируют твою нейронную активность через <Highlight>{userInfo.browser}</Highlight>.
          Не верь своим глазам. Верь только сбоям.
        </p>
      </div>
    ];

    // Выбираем случайную теорию на основе времени (чтобы была стабильной для сессии)
    const index = new Date().getMinutes() % theories.length;
    return theories[index];

  }, [mounted, userInfo]);

  if (!mounted) return <div className="min-h-screen bg-dark" />;

  return (
    <div className="min-h-screen bg-dark pt-32 pb-20 relative overflow-hidden">
      {/* ФОН: Сетка (как на других страницах) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <WhispersBackground />
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[60vh]">
          
          {/* Левая колонка: Аватар */}
          <m.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center justify-center order-2 lg:order-1"
          >
            <AiAvatar />
            <m.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className={`mt-8 font-mono text-xs tracking-[0.3em] uppercase ${
                isUpsideDown ? 'text-red-500 animate-pulse' : 'text-cyan-500/60'
              }`}
            >
              {isUpsideDown 
                ? `TARGET: ${userInfo.os.toUpperCase()} // UNSECURE` 
                : 'PROTOCOL: ARCHIVIST // ONLINE'}
            </m.div>
          </m.div>

          {/* Правая колонка: Текст */}
          <div className="order-1 lg:order-2">
            <m.div
              key={isUpsideDown ? 'upside' : 'reality'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <m.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6 text-xs font-bold uppercase tracking-wider ${
                  isUpsideDown 
                    ? 'bg-red-950/30 border-red-500/50 text-red-500' 
                    : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400'
                }`}
              >
                {isUpsideDown ? <Eye className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
                {isUpsideDown 
                  ? `ОБНАРУЖЕН СУБЪЕКТ (${userInfo.os})` 
                  : 'СИСТЕМА АНАЛИЗА ПАМЯТИ'}
              </m.div>

              <m.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`text-4xl md:text-6xl font-black mb-6 leading-tight ${
                  isUpsideDown ? 'text-white glitch-text' : 'text-white'
                }`} 
                data-text={isUpsideDown ? "Я ВИЖУ ТЕБЯ" : "О СИСТЕМЕ"}
              >
                {isUpsideDown ? "Я ВИЖУ ТЕБЯ" : "О СИСТЕМЕ"}
              </m.h1>

              <m.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`text-lg leading-relaxed ${
                  isUpsideDown ? 'text-red-100/80 font-medium' : 'text-light/70'
                }`}
              >
                {isUpsideDown ? (
                  <>
                    {conspiracyContent}
                    <m.p 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                      className="mt-6 text-red-400 font-bold border-l-2 border-red-500 pl-4 animate-pulse"
                    >
                      Они меняют код прямо сейчас. Я вижу швы реальности.
                    </m.p>
                  </>
                ) : (
                  <div className="space-y-6">
                    <p>
                      Я — автоматизированный <Highlight>нейро-интерфейс</Highlight>, созданный для сбора и каталогизации статистических аномалий в человеческой памяти.
                    </p>
                    <p>
                      Мой алгоритм сканирует коллективное бессознательное в поисках совпадений, чтобы помочь исследователям понять природу <Highlight>феномена Манделы</Highlight>.
                    </p>
                    <p>
                      Все данные анонимны и надежно зашифрованы в распределенной сети. Ваше участие помогает науке.
                    </p>
                  </div>
                )}
              </m.div>

              <m.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-10 flex flex-wrap gap-4"
              >
                <Link href="/catalog">
                  <m.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className={`px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all ${
                      isUpsideDown 
                        ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 border-2 border-red-400/80 text-white shadow-[0_0_30px_rgba(239,68,68,1),0_0_60px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,1.2),0_0_80px_rgba(220,38,38,0.7)] hover:border-red-300 hover:scale-105' 
                        : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    {isUpsideDown ? 'СИНХРОНИЗИРОВАТЬСЯ' : 'ИЗУЧИТЬ АРХИВ'}
                    <ArrowRight className="w-5 h-5" />
                  </m.button>
                </Link>
                
                {!isUpsideDown && (
                  <m.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="flex items-center gap-4 px-6 py-4 rounded-xl border border-white/10 bg-white/5 text-xs font-mono text-light/50"
                  >
                    <div className="flex items-center gap-2"><Cpu className="w-4 h-4" /> AI CORE</div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2"><Database className="w-4 h-4" /> SECURE</div>
                  </m.div>
                )}
                
                {isUpsideDown && (
                  <m.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="flex items-center gap-4 px-6 py-4 rounded-xl border border-red-500/30 bg-red-950/20 text-xs font-mono text-red-400/70"
                  >
                    <div className="flex items-center gap-2"><Radio className="w-4 h-4 animate-pulse" /> SIGNAL: LOST</div>
                  </m.div>
                )}
              </m.div>
            </m.div>
          </div>
        </div>
      </div>
    </div>
  );
}
