'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import CipherReveal from '@/components/ui/CipherReveal';
import { cn } from '@/lib/utils';

interface StepCardProps {
  stepNumber: string;
  title: string;
  description: string;
  icon: any;
  isUpsideDown: boolean;
  index: number;
}

export default function StepCard({ stepNumber, title, description, icon: Icon, isUpsideDown, index }: StepCardProps) {
  // Шаги 01 и 03 слева, шаги 02 и 04 справа
  const isRight = index % 2 === 1; // index 1 (02) и 3 (04) → справа
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative flex items-center justify-between w-full">
      {/* Пустое пространство слева (для правых карточек) */}
      {isRight && <div className="w-[42%]" />}

      {/* 1. Контент Карточки (42% ширины для компактности) */}
      <motion.div 
        initial={{ opacity: 0, x: isRight ? 30 : -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "w-[42%] p-5 rounded-xl border relative group transition-all duration-500 cursor-default",
          isUpsideDown 
            ? "bg-black/90 border-red-500/30 hover:border-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]" 
            : "bg-darkCard/80 border-white/10 hover:border-cyan-500/30 hover:shadow-lg"
        )}
      >
        {/* Номер шага (Синий неон в реальности, красный неон в изнанке) */}
        <div className={cn(
          "absolute top-2 right-3 text-4xl font-black select-none transition-colors duration-500 z-0",
          isUpsideDown 
            ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" 
            : "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
        )}>
          {stepNumber}
        </div>

        <div className="relative z-10">
            {/* Иконка */}
            <div className={cn(
            "mb-3 p-2 rounded-lg w-fit transition-colors duration-500",
            isUpsideDown ? "bg-red-950/50 text-red-500" : "bg-white/5 text-cyan-400"
            )}>
            <Icon className="w-5 h-5" />
            </div>

            {/* Заголовок с дешифровкой при наведении */}
            <h3 className={cn(
            "text-lg font-bold mb-2 uppercase tracking-wide min-h-[28px]",
            isUpsideDown ? "text-white" : "text-white"
            )}>
            {/* В Изнанке перезапускаем эффект при наведении */}
            {isUpsideDown ? (
                isHovered ? <CipherReveal text={title} reveal={true} key="hovered" /> : title
            ) : (
                <CipherReveal text={title} reveal={true} />
            )}
            </h3>

            {/* Описание */}
            <p className={cn(
            "text-xs leading-relaxed transition-colors duration-500",
            isUpsideDown ? "text-red-100/70 font-medium" : "text-light/60"
            )}>
            {description}
            </p>
        </div>

        {/* Глитч-декор для Изнанки */}
        {isUpsideDown && (
          <>
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-red-500" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-red-500" />
          </>
        )}
      </motion.div>

      {/* 2. Центральный узел (на линии) */}
      <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 z-10 flex items-center justify-center bg-dark transition-colors duration-500"
           style={{ borderColor: isUpsideDown ? '#ef4444' : '#06b6d4' }}>
        <div className={cn(
          "w-1 h-1 rounded-full transition-colors duration-500",
          isUpsideDown ? "bg-red-500 animate-ping" : "bg-cyan-400"
        )} />
      </div>

      {/* 3. Пустое пространство справа (для левых карточек) */}
      {!isRight && <div className="w-[42%]" />}
    </div>
  );
}
