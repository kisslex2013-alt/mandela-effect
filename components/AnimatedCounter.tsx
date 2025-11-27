'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  className?: string;
  suffix?: string;
}

export default function AnimatedCounter({ 
  value, 
  decimals = 0, 
  className = '',
  suffix = '' 
}: AnimatedCounterProps) {
  const [mounted, setMounted] = useState(false);
  const spring = useSpring(0, { 
    duration: 1000,
    bounce: 0 
  });
  
  const display = useTransform(spring, (current) => 
    current.toFixed(decimals) + suffix
  );

  // Устанавливаем mounted ОДИН раз
  useEffect(() => {
    setMounted(true);
  }, []);

  // Обновляем значение ТОЛЬКО после mounted
  useEffect(() => {
    if (mounted) {
      spring.set(value);
    }
  }, [mounted, spring, value]);

  // Показываем статичное значение на SSR
  if (!mounted) {
    return (
      <span className={className}>
        {value.toFixed(decimals)}{suffix}
      </span>
    );
  }

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}

