'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { m } from 'framer-motion';
import { makePath, generateSeed, polarToCartesian } from '@/lib/radar-utils';

interface HolographicRadarProps {
  data: { subject: string; A: number }[];
  isUpsideDown: boolean;
  className?: string;
}

export default function HolographicRadar({ data, isUpsideDown, className = '' }: HolographicRadarProps) {
  const [seed, setSeed] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Инициализация Seed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      const screen = window.screen.width + window.screen.height;
      setSeed(generateSeed(ua + screen));
    }
  }, []);

  // Обновление размеров при изменении размера контейнера
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({ width: rect.width, height: rect.height });
        }
      }
    };

    // Первое обновление с задержкой для гарантии рендера
    const timeout = setTimeout(updateDimensions, 100);
    
    // Используем ResizeObserver для более точного отслеживания
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateDimensions);
      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  const values = data.map(d => d.A);
  const padding = 50; // Больше отступ для подписей

  // Генерация путей
  const mainPath = useMemo(() => 
    makePath(values, dimensions.width, dimensions.height, padding, isUpsideDown ? 20 : 0, seed), 
  [values, dimensions, isUpsideDown, seed]);

  const layer2Path = useMemo(() => 
    makePath(values, dimensions.width, dimensions.height, padding, isUpsideDown ? 30 : 0, seed + 1), 
  [values, dimensions, isUpsideDown, seed]);

  // Координаты точек для отрисовки "узлов" (светящихся точек)
  const points = useMemo(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) / 2 - padding;
    const angleStep = 360 / data.length;

    return values.map((value, i) => {
      // Учитываем искажение для точек в Изнанке
      const distortion = isUpsideDown ? (Math.sin(i * seed) * Math.cos(seed * i)) * 20 : 0;
      const val = Math.max(0, Math.min(100, value + distortion));
      return polarToCartesian(centerX, centerY, (val / 100) * radius, i * angleStep);
    });
  }, [values, dimensions, padding, data.length, isUpsideDown, seed]);

  // Координаты подписей
  const labels = useMemo(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) / 2 - padding + 25; // Чуть дальше
    const angleStep = 360 / data.length;

    return data.map((item, i) => {
        return {
            ...polarToCartesian(centerX, centerY, radius, i * angleStep),
            label: item.subject
        };
    });
  }, [data, dimensions, padding]);

  // Цвета
  const primaryColor = isUpsideDown ? "#ef4444" : "#3b82f6"; // Red vs Blue
  const secondaryColor = isUpsideDown ? "#7f1d1d" : "#1e3a8a"; // Darker shades

  return (
    <div ref={containerRef} className={`relative w-full h-full flex items-center justify-center ${className}`}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Градиент для заливки (Голограмма) */}
          <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.05" />
          </linearGradient>
          
          {/* Свечение для точек */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* --- ФОНОВАЯ СЕТКА (HUD STYLE) --- */}
        <g className="opacity-20">
          {/* Концентрические круги (Прицел) */}
          {[100, 75, 50, 25].map((level, i) => (
            <circle 
              key={i}
              cx={dimensions.width / 2}
              cy={dimensions.height / 2}
              r={(Math.min(dimensions.width, dimensions.height) / 2 - padding) * (level / 100)}
              fill="none"
              stroke={primaryColor}
              strokeWidth="1"
              strokeDasharray={i % 2 === 0 ? "4 4" : "0"} // Чередуем пунктир
            />
          ))}
          
          {/* Осевые линии (Перекрестие) */}
          <line x1={dimensions.width / 2} y1={padding} x2={dimensions.width / 2} y2={dimensions.height - padding} stroke={primaryColor} strokeWidth="1" />
          <line x1={padding} y1={dimensions.height / 2} x2={dimensions.width - padding} y2={dimensions.height / 2} stroke={primaryColor} strokeWidth="1" />
        </g>

        {/* --- ГРАФИК --- */}

        {/* Слой 2 (Эхо/Призрак) - Анимированный */}
        <m.path
          d={layer2Path}
          fill="none"
          stroke={primaryColor}
          strokeWidth="1"
          opacity="0.3"
          animate={{ 
            scale: isUpsideDown ? [1, 1.05, 0.95, 1] : [1, 1.02, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: isUpsideDown ? 0.2 : 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: 'center' }}
        />

        {/* Слой 1 (Основной) */}
        <m.path
          d={mainPath}
          fill="url(#radarGradient)"
          stroke={primaryColor}
          strokeWidth="2"
          filter="url(#glow)"
          initial={false}
          animate={{ 
            d: mainPath, // Анимация формы при смене данных
          }}
          transition={{ duration: 0.5 }}
        />

        {/* --- ТОЧКИ НА ВЕРШИНАХ --- */}
        {points.map((p, i) => (
          <m.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={isUpsideDown ? 2 : 3}
            fill={isUpsideDown ? "#fff" : "#fff"}
            stroke={primaryColor}
            strokeWidth="2"
            filter="url(#glow)"
            animate={{
                r: isUpsideDown ? [2, 4, 2] : [3, 4, 3],
                opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: isUpsideDown ? 0.1 : 2, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}

        {/* --- ПОДПИСИ --- */}
        {labels.map((item, i) => (
            <text
              key={i}
              x={item.x}
              y={item.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isUpsideDown ? "#fca5a5" : "#93c5fd"}
              className="text-[10px] font-mono uppercase tracking-wider font-bold"
              style={{ 
                  textShadow: isUpsideDown ? '0 0 5px red' : '0 0 5px blue',
                  fontSize: '10px' 
              }}
            >
              {item.label}
            </text>
        ))}
      </svg>
      
      {/* Глитч-оверлей для Изнанки (Помехи) */}
      {isUpsideDown && (
        <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none mix-blend-overlay z-10" />
      )}
    </div>
  );
}
