'use client';

import { useReality } from '@/lib/context/RealityContext';
import { useEffect, useState } from 'react';

export default function UpsideDownLayer() {
  const { isUpsideDown } = useReality();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    </div>
  );
}
