'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loading({ text = 'Загрузка...', size = 'md' }: LoadingProps) {
  const [mounted, setMounted] = useState(false);
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // На SSR показываем статичную версию
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="relative">
          <div className={`${sizeClasses[size]} rounded-full border-4 border-primary/20 animate-spin`} />
          <div className={`${sizeClasses[size]} absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin`} style={{ animationDuration: '1s' }} />
        </div>
        <p className="text-light/60 font-medium">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative">
        {/* Внешнее кольцо */}
        <motion.div
          className={`${sizeClasses[size]} rounded-full border-4 border-primary/20`}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Внутреннее кольцо */}
        <motion.div
          className={`${sizeClasses[size]} absolute inset-0 rounded-full border-4 border-transparent border-t-primary`}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Пульсирующий текст */}
      <motion.p
        className="text-light/60 font-medium"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {text}
      </motion.p>
    </div>
  );
}

