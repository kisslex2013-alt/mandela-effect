'use client';

import { useReality } from '@/lib/context/RealityContext';
import { useState, useEffect } from 'react';

interface SpectrumChartProps {
  data: { name: string; value: number; icon?: any }[];
}

export default function SpectrumChart({ data }: SpectrumChartProps) {
  const { isUpsideDown } = useReality();
  const [glitchStates, setGlitchStates] = useState<Record<string, boolean[]>>({});

  // Генерируем детерминированные состояния глитча для каждого сегмента
  useEffect(() => {
    if (isUpsideDown) {
      const states: Record<string, boolean[]> = {};
      data.forEach(item => {
        states[item.name] = Array.from({ length: 20 }, () => Math.random() > 0.85);
      });
      setGlitchStates(states);
      
      const interval = setInterval(() => {
        const newStates: Record<string, boolean[]> = {};
        data.forEach(item => {
          newStates[item.name] = Array.from({ length: 20 }, () => Math.random() > 0.85);
        });
        setGlitchStates(newStates);
      }, 200);
      
      return () => clearInterval(interval);
    } else {
      setGlitchStates({});
    }
  }, [isUpsideDown, data]);

  return (
    <div className="space-y-4 w-full">
      {data.map((item, index) => (
        <div key={item.name} className="flex items-center gap-4 group">
          {/* Лейбл */}
          <div className="w-32 text-right text-xs font-mono text-light/60 uppercase tracking-wider flex items-center justify-end gap-2">
            {item.name}
            {item.icon && <item.icon className="w-3 h-3 opacity-50" />}
          </div>

          {/* Полоса (Сегменты) */}
          <div className="flex-1 h-6 bg-black/40 rounded flex items-center px-1 gap-[2px] overflow-hidden relative">
            {/* Генерируем 20 сегментов */}
            {Array.from({ length: 20 }).map((_, i) => {
              const isActive = (item.value / 5) > i; // value (0-100) / 5 = 20 segments
              const isGlitch = isUpsideDown && glitchStates[item.name]?.[i];
              
              return (
                <div 
                  key={i}
                  className={`h-3 w-full rounded-[1px] transition-all duration-300 ${
                    isActive 
                      ? isUpsideDown 
                        ? 'bg-red-500 shadow-[0_0_5px_red]' 
                        : 'bg-cyan-500 shadow-[0_0_5px_cyan]'
                      : 'bg-white/5'
                  } ${isGlitch ? 'opacity-0' : 'opacity-100'}`}
                />
              );
            })}
            
            {/* Значение */}
            <div className={`absolute right-2 text-[10px] font-bold ${
                isUpsideDown ? 'text-red-400' : 'text-white'
            }`}>
                {item.value}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

