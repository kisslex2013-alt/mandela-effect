'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { useReality } from '@/lib/context/RealityContext';
import { Github, Mail, Send, Database, Server, Cpu } from 'lucide-react';

// Мини-компонент для глитч-статуса
const GlitchStatus = ({ 
  icon: Icon, 
  label, 
  normalText, 
  normalColor, 
  glitchValues 
}: { 
  icon: any, 
  label: string, 
  normalText: string, 
  normalColor: string, 
  glitchValues: { text: string, color: string }[] 
}) => {
  const [currentText, setCurrentText] = useState(normalText);
  const [currentColor, setCurrentColor] = useState(normalColor);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // Запускаем хаос
    const id = setInterval(() => {
      const randomVariant = Math.random() > 0.3 
        ? glitchValues[Math.floor(Math.random() * glitchValues.length)] 
        : { text: normalText, color: normalColor };
      
      setCurrentText(randomVariant.text);
      setCurrentColor(randomVariant.color);
    }, 100); // Скорость глитча
    setIntervalId(id);
  };

  const handleMouseLeave = () => {
    if (intervalId) clearInterval(intervalId);
    setCurrentText(normalText);
    setCurrentColor(normalColor);
  };

  return (
    <div 
      className="flex justify-between items-center p-2 bg-white/5 rounded border border-white/5 hover:border-white/20 transition-colors cursor-help select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-2 text-light/60">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <span className={`font-bold font-mono transition-colors ${currentColor}`}>
        {currentText}
      </span>
    </div>
  );
};

export default function Footer() {
  const { isUpsideDown } = useReality();
  const currentYear = new Date().getFullYear();
  
  // ЗАКОММЕНТИРОВАНО ДЛЯ ОПТИМИЗАЦИИ - бегущая строка отключена
  // const systemLogs = [
  //   "INITIALIZING REALITY PROTOCOL... COMPLETE",
  //   "SCANNING SECTOR 7G... WARNING: ANOMALY DETECTED",
  //   "MEMORY INTEGRITY CHECK... ENABLED",
  //   "CONNECTION TO HOST... BLOCKED",
  //   "LOADING COLLECTIVE UNCONSCIOUS... 98%",
  //   "CRITICAL FAILURE IN MEMORY_BLOCK_04",
  //   "SYSTEM REBOOT... ERROR",
  //   "TIMELINE DIVERGENCE... STABLE",
  //   "SYNCING DATA... COMPLETE"
  // ];

  // const getLogStyle = (text: string) => {
  //   if (text.includes("ERROR") || text.includes("FAILURE") || text.includes("BLOCKED")) {
  //     return "text-red-500 animate-pulse font-bold";
  //   }
  //   if (text.includes("WARNING") || text.includes("ANOMALY")) {
  //     return "text-yellow-400 animate-pulse";
  //   }
  //   if (text.includes("COMPLETE") || text.includes("ENABLED") || text.includes("STABLE")) {
  //     return "text-green-400";
  //   }
  //   return "text-white/30";
  // };

  return (
    <footer className="relative bg-black border-t border-white/10 font-mono text-xs overflow-hidden mt-auto">
      
      {/* 1. RUNNING TICKER (Бегущая строка) - ЗАКОММЕНТИРОВАНО ДЛЯ ОПТИМИЗАЦИИ */}
      {/* <div className="w-full bg-white/5 border-b border-white/5 py-2 overflow-hidden flex select-none relative z-10">
        <m.div 
          className="flex gap-12 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
        >
          {[...systemLogs, ...systemLogs, ...systemLogs].map((log, i) => (
            <span key={i} className={`flex items-center gap-2 ${getLogStyle(log)}`}>
              <span className="w-1.5 h-1.5 bg-current rounded-full opacity-50" />
              {log}
            </span>
          ))}
        </m.div>
      </div> */}

      <div 
        className="max-w-7xl mx-auto px-6 py-12 relative z-10 transition-transform duration-500"
        style={isUpsideDown ? { transform: 'scaleX(-1)' } : {}}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* COL 1: INFO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-4 h-4 bg-gradient-to-br from-primary to-purple-600 rounded-sm" />
              <span className="font-bold tracking-widest text-lg">MANDELA_DB</span>
            </div>
            <p className="text-light/50 leading-relaxed max-w-xs">
              Архив коллективных ложных воспоминаний. Исследование сбоев в матрице и человеческом восприятии.
            </p>
            <div className="flex gap-4 pt-2">
              <a 
                href="https://github.com/kisslex2013-alt" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-white/5 rounded hover:bg-white/10 hover:text-white text-light/50 transition-colors"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a 
                href="https://t.me/klsorat" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-white/5 rounded hover:bg-white/10 hover:text-white text-light/50 transition-colors"
                title="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
              <a 
                href="mailto:k1sslex@yandex.ru" 
                className="p-2 bg-white/5 rounded hover:bg-white/10 hover:text-white text-light/50 transition-colors"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* COL 2: NAVIGATION */}
          <div>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">&gt;</span> НАВИГАЦИЯ
            </h3>
            <ul className="space-y-2 text-light/60">
              <li>
                <Link href="/" className="hover:text-primary hover:pl-2 transition-all block">
                  [01] Главная
                </Link>
              </li>
              <li>
                <Link href="/catalog" className="hover:text-primary hover:pl-2 transition-all block">
                  [02] Каталог
                </Link>
              </li>
              <li>
                <Link href="/my-memory" className="hover:text-primary hover:pl-2 transition-all block">
                  [03] Память
                </Link>
              </li>
              <li>
                <Link href="/stats" className="hover:text-primary hover:pl-2 transition-all block">
                  [04] Статистика
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-primary hover:pl-2 transition-all block">
                  [06] Как устроено
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary hover:pl-2 transition-all block">
                  [07] О проекте
                </Link>
              </li>
              <li>
                <Link href="/submit" className="hover:text-primary hover:pl-2 transition-all block">
                  [05] Добавить эффект
                </Link>
              </li>
            </ul>
          </div>

          {/* COL 3: SYSTEM STATUS */}
          <div>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="text-green-500 animate-pulse">●</span> SYSTEM_STATUS
            </h3>
            <div className="space-y-3">
              <GlitchStatus 
                icon={Server} 
                label="Server" 
                normalText="ONLINE" 
                normalColor="text-green-400"
                glitchValues={[
                  { text: "OFFLINE", color: "text-red-500" },
                  { text: "WAITING", color: "text-yellow-400" },
                  { text: "ERR_500", color: "text-red-600" }
                ]}
              />
              
              <GlitchStatus 
                icon={Database} 
                label="Database" 
                normalText="SYNCED" 
                normalColor="text-blue-400"
                glitchValues={[
                  { text: "UNSYNCED", color: "text-yellow-500" },
                  { text: "CORRUPT", color: "text-red-500" },
                  { text: "SYNCING...", color: "text-blue-300" }
                ]}
              />

              <GlitchStatus 
                icon={Cpu} 
                label="Core" 
                normalText="v2.4.0" 
                normalColor="text-purple-400"
                glitchValues={[
                  { text: "v0.4.2", color: "text-red-400" },
                  { text: "v?.?.?", color: "text-white" },
                  { text: "LEGACY", color: "text-yellow-600" }
                ]}
              />
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-light/30">
          <p>© {currentYear} MANDELA_EFFECT_PROJECT. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">PRIVACY_PROTOCOL</span>
            <span className="hover:text-white cursor-pointer transition-colors">TERMS_OF_SIMULATION</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
