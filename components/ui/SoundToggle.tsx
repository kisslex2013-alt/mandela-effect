'use client';

import { useSound } from '@/lib/hooks/useSound';
import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SoundToggle() {
  const { isMuted, toggleMute } = useSound();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={toggleMute}
      className={`
        fixed bottom-24 right-6 z-50 
        p-3 rounded-xl
        bg-black/40 backdrop-blur-md 
        border border-white/10 
        transition-all duration-300
        ${!isMuted 
          ? 'text-primary border-primary/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
          : 'text-white/50 hover:text-white hover:border-white/30'
        }
      `}
      aria-label={isMuted ? "Включить звук" : "Выключить звук"}
    >
      {isMuted ? (
        <VolumeX className="w-6 h-6 transition-transform hover:scale-110" />
      ) : (
        <Volume2 className="w-6 h-6 transition-transform hover:scale-110" />
      )}
    </button>
  );
}
