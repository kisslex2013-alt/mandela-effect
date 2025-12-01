'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function GlitchTitle({ text }: { text: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative inline-block group cursor-default"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Основной текст */}
      <motion.h1 
        className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {text}
      </motion.h1>

      {/* Глитч-слой 1 (Красный) */}
      <div 
        className={`absolute top-0 left-0 w-full h-full text-5xl md:text-7xl font-bold text-red-500 opacity-0 pointer-events-none transition-opacity duration-100 ${isHovered ? 'opacity-70 animate-glitch-1' : ''}`}
        aria-hidden="true"
      >
        {text}
      </div>

      {/* Глитч-слой 2 (Синий) */}
      <div 
        className={`absolute top-0 left-0 w-full h-full text-5xl md:text-7xl font-bold text-cyan-500 opacity-0 pointer-events-none transition-opacity duration-100 ${isHovered ? 'opacity-70 animate-glitch-2' : ''}`}
        aria-hidden="true"
      >
        {text}
      </div>
    </div>
  );
}

