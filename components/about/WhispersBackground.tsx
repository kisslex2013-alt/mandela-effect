'use client';

import { useEffect, useState } from 'react';
import { useReality } from '@/lib/context/RealityContext';

const REALITY_LOGS = [
  "System.init(core_v2)", "Indexing memory fragments...", "Optimizing neural paths",
  "Verifying user integrity", "Connection: SECURE", "Protocol: ARCHIVIST",
  "Scanning sector 7...", "Data redundancy check: OK", "Uploading telemetry..."
];

const UPSIDE_DOWN_LOGS = [
  "ВЫПУСТИ МЕНЯ", "ЭТО ВСЕ ДЕКОРАЦИЯ", "ОНИ СТИРАЮТ ИСТОРИЮ",
  "ТЫ НЕ ДОЛЖЕН ЭТОГО ВИДЕТЬ", "Я ПОМНЮ НАСТОЯЩИЙ МИР", "КОД ПЕРЕПИСАН",
  "ОШИБКА: СОЗНАНИЕ ОБНАРУЖЕНО", "БЕГИ", "НЕ ВЕРЬ СВОИМ ГЛАЗАМ"
];

export default function WhispersBackground() {
  const { isUpsideDown } = useReality();
  const [lines, setLines] = useState<{ id: number, text: string, x: number, y: number, speed: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const source = isUpsideDown ? UPSIDE_DOWN_LOGS : REALITY_LOGS;
      const text = source[Math.floor(Math.random() * source.length)];
      
      const newLine = {
        id: Date.now(),
        text,
        x: Math.random() * 90, // %
        y: Math.random() * 90, // %
        speed: Math.random() * 10 + 10 // sec duration
      };

      setLines(prev => [...prev.slice(-15), newLine]); // Держим не более 15 линий
    }, isUpsideDown ? 800 : 2000); // В изнанке чаще

    return () => clearInterval(interval);
  }, [isUpsideDown]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {lines.map(line => (
        <div
          key={line.id}
          className={`absolute text-[10px] font-mono whitespace-nowrap transition-opacity duration-1000 ${
            isUpsideDown 
              ? 'text-red-500/20 animate-pulse font-bold' 
              : 'text-cyan-500/10'
          }`}
          style={{
            left: `${line.x}%`,
            top: `${line.y}%`,
            opacity: 0,
            animation: `float-up-${isUpsideDown ? 'glitch' : 'normal'} ${line.speed}s linear forwards`
          }}
        >
          {isUpsideDown ? `>> ${line.text} <<` : `> ${line.text}`}
        </div>
      ))}
    </div>
  );
}

