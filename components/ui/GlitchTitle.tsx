'use client';

import { m } from 'framer-motion';

export default function GlitchTitle({ text }: { text: string }) {
  // Разделяем текст по первому пробелу: первое слово белое, остальное - градиент
  const parts = text.split(' ');
  const firstWord = parts[0];
  const restWords = parts.slice(1).join(' ');

  return (
    <m.h1 
      className="text-5xl md:text-7xl font-black text-white relative z-10 tracking-tighter leading-tight glitch-text md:whitespace-nowrap"
      data-text={text}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {firstWord}
      {restWords && (
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          {' '}{restWords}
        </span>
      )}
    </m.h1>
  );
}
