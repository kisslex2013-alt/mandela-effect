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
      className="fixed bottom-32 right-8 z-50 p-3 bg-darkCard/80 backdrop-blur-md border border-light/10 rounded-full text-light/60 hover:text-light hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/20 group"
      aria-label={isMuted ? "Включить звук" : "Выключить звук"}
    >
      {isMuted ? (
        <VolumeX className="w-6 h-6 group-hover:scale-110 transition-transform" />
      ) : (
        <Volume2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
}
