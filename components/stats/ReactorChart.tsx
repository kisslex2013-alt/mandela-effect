'use client';

import { useReality } from '@/lib/context/RealityContext';
import { motion } from 'framer-motion';

interface ReactorChartProps {
  percentage: number; // 0-100 (Процент Манделы)
}

export default function ReactorChart({ percentage }: ReactorChartProps) {
  const { isUpsideDown } = useReality();
  const color = isUpsideDown ? '#ef4444' : '#3b82f6'; // Red vs Blue

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Внешнее кольцо (Статор) */}
      <div className={`absolute inset-0 rounded-full border-2 border-dashed opacity-30 ${
        isUpsideDown ? 'border-red-500 animate-reactor-wobble' : 'border-cyan-500 animate-reactor-spin'
      }`} />
      
      {/* Внутреннее кольцо (Ротор) */}
      <div className={`absolute inset-4 rounded-full border border-dotted opacity-50 ${
        isUpsideDown ? 'border-red-400' : 'border-cyan-400'
      }`} style={{ 
        animation: 'reactor-spin 15s linear infinite',
        animationDirection: 'reverse',
        transformOrigin: 'center'
      }} />

      {/* Ядро (Core) */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-5xl font-black font-mono ${
            isUpsideDown ? 'text-red-500 glitch-text' : 'text-white'
          }`}
          data-text={`${percentage}%`}
        >
          {percentage}%
        </motion.div>
        <div className={`text-[10px] uppercase tracking-[0.3em] mt-2 ${
          isUpsideDown ? 'text-red-400 font-bold' : 'text-cyan-400'
        }`}>
          {isUpsideDown ? 'ЗАРАЖЕНИЕ' : 'МАНДЕЛА'}
        </div>
      </div>

      {/* Энергетическое поле (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle 
          cx="50" cy="50" r="40" 
          fill="none" 
          stroke={color} 
          strokeWidth="4" 
          strokeDasharray={`${percentage * 2.51} 251`} 
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          filter="url(#glow)"
        />
      </svg>
      
      {/* Глитч-частицы для Изнанки */}
      {isUpsideDown && (
        <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse mix-blend-overlay filter blur-xl" />
      )}
    </div>
  );
}

