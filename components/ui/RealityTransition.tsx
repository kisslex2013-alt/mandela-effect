'use client';

import { useReality } from '@/lib/context/RealityContext';
import { m, AnimatePresence } from 'framer-motion';

export default function RealityTransition() {
  const { isTransitioning } = useReality();

  return (
    <AnimatePresence>
      {isTransitioning && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-black pointer-events-none overflow-hidden flex items-center justify-center"
        >
          {/* RGB Сдвиг - Красный канал */}
          <m.div
            animate={{ x: [-5, 5, -5, 5, 0], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 bg-red-600 mix-blend-screen"
            style={{ left: '-4px' }}
          />
          
          {/* RGB Сдвиг - Синий канал */}
          <m.div
            animate={{ x: [5, -5, 5, -5, 0], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 bg-blue-600 mix-blend-screen"
            style={{ left: '4px' }}
          />

          {/* Основная вспышка и тряска */}
          <m.div
            animate={{ 
              scale: [1, 1.1, 1],
              filter: ['brightness(1)', 'brightness(3) contrast(2)', 'brightness(1)']
            }}
            transition={{ duration: 1.0 }}
            className="relative w-full h-full bg-white mix-blend-overlay opacity-50"
          />
          
          {/* Scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0)_50%)] bg-[length:100%_4px]" />
        </m.div>
      )}
    </AnimatePresence>
  );
}
