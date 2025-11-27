'use client';

import { memo } from 'react';

interface DonutChartProps {
  majorityPercent: number;
  minorityPercent: number;
}

export const DonutChart = memo(({ majorityPercent, minorityPercent }: DonutChartProps) => {
  const size = 200;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Длина дуги для большинства (синий)
  const majorityLength = (majorityPercent / 100) * circumference;
  // Длина дуги для меньшинства (оранжевый)
  const minorityLength = (minorityPercent / 100) * circumference;
  // Смещение для меньшинства (начинается после большинства)
  const minorityOffset = circumference - majorityLength;

  // Внутренний радиус для центрального круга
  const innerRadius = radius - strokeWidth / 2;

  return (
    <div className="relative" style={{ width: size, height: size }} aria-label={`Диаграмма: ${majorityPercent}% большинство, ${minorityPercent}% меньшинство`}>
      <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
        {/* Фоновый круг */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth={strokeWidth}
        />
        {/* Синий сегмент (большинство) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          strokeDasharray={`${majorityLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        {/* Оранжевый сегмент (меньшинство) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={strokeWidth}
          strokeDasharray={`${minorityLength} ${circumference}`}
          strokeDashoffset={minorityOffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        {/* Круг в центре с фоном */}
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={innerRadius} 
          fill="rgb(30, 30, 30)" 
        />
      </svg>
      {/* Центральный текст */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-light">{majorityPercent}%</div>
          <div className="text-sm text-light/60">большинство</div>
        </div>
      </div>
    </div>
  );
});

DonutChart.displayName = 'DonutChart';

