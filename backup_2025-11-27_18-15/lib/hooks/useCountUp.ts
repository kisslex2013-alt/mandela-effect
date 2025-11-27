'use client';

import { useState, useEffect } from 'react';

/**
 * Хук для анимации счётчика чисел от 0 до целевого значения
 * @param end - Конечное значение
 * @param duration - Длительность анимации в миллисекундах (по умолчанию 2000)
 * @param shouldStart - Начинать ли анимацию (по умолчанию true)
 * @returns Текущее значение счётчика
 */
export const useCountUp = (end: number, duration = 2000, shouldStart = true): number => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart || end === 0) {
      setCount(0);
      return;
    }
    
    let start = 0;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration, shouldStart]);

  return count;
};

