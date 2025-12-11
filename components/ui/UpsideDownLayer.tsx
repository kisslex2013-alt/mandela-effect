'use client';

import { useReality } from '@/lib/context/RealityContext';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Генератор случайных фраз для подсознания
const generateSubliminalText = () => {
  const words1 = ["ОНИ", "ТЫ", "МЫ", "КТО", "ГДЕ", "ЗАЧЕМ"];
  const words2 = ["ЛГУТ", "СПИШЬ", "ЗДЕСЬ", "СМОТРЯТ", "ЗАБЫЛ", "ВИДИШЬ"];
  const glitch = ["ERROR", "NULL", "VOID", "0x00", "WAKE_UP", "NO_SIGNAL"];
  
  const r = Math.random();
  if (r > 0.6) return glitch[Math.floor(Math.random() * glitch.length)];
  
  const w1 = words1[Math.floor(Math.random() * words1.length)];
  const w2 = words2[Math.floor(Math.random() * words2.length)];
  return `${w1} ${w2}`;
};

export default function UpsideDownLayer() {
  const { isUpsideDown } = useReality();
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState<{ text: string, x: number, y: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Логика скрытых посланий
  useEffect(() => {
    if (!isUpsideDown || !mounted) return;

    console.log('[UpsideDownLayer] Скрытые послания активированы');

    const interval = setInterval(() => {
      // 40% шанс появления сообщения
      if (Math.random() > 0.6) {
        const x = Math.random() * 80 + 10; // 10-90% width
        const y = Math.random() * 80 + 10; // 10-90% height
        
        const generatedText = generateSubliminalText();
        console.log('[UpsideDownLayer] Показываем послание:', generatedText, 'at', x, y);
        
        setMessage({
          text: generatedText,
          x,
          y,
        });

        // Исчезает через 250мс
        setTimeout(() => {
          setMessage(null);
          console.log('[UpsideDownLayer] Послание скрыто');
        }, 250);
      }
    }, 1500); // Чаще проверяем

    return () => clearInterval(interval);
  }, [isUpsideDown, mounted]);

  if (!mounted || !isUpsideDown) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* 1. Двойной Неон (Красный слева, Синий справа) */}
      <div className="absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(ellipse_at_left,_rgba(220,38,38,0.25)_0%,_transparent_70%)] mix-blend-screen animate-pulse-slow" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_right,_rgba(6,182,212,0.2)_0%,_transparent_70%)] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      {/* 2. Нижний туман */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
      
      {/* 3. Зернистость пленки */}
      <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-150 contrast-150" />
      
      {/* 4. Летающие споры (Меньше, но качественнее) */}
      <div className="spores-container">
        <div className="spore" />
        <div className="spore" />
        <div className="spore" />
        <div className="spore" />
        <div className="spore" />
        <div className="spore" />
        <div className="spore" />
      </div>
      
      {/* 5. Виньетка */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.9)_100%)] z-10" />
      
      {/* 6. Скрытые послания */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message.text + message.x + message.y}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.30 }} // Увеличена видимость
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute text-4xl font-black text-red-600 tracking-widest uppercase z-[200] select-none blur-[1px] pointer-events-none"
            style={{ 
              left: `${message.x}%`, 
              top: `${message.y}%`, 
              transform: 'translate(-50%, -50%) rotate(-5deg)',
              textShadow: '0 0 10px rgba(220, 38, 38, 0.5)'
            }}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
