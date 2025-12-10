'use client';

import { useReality } from '@/lib/context/RealityContext';
import { CheckCircle2 } from 'lucide-react';

export default function UserContribution() {
  const { voteCount } = useReality();

  return (
    <div className="flex flex-col items-center justify-center p-4 group hover:bg-white/5 rounded-2xl transition-colors duration-300">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="w-5 h-5 text-stranger-red group-hover:scale-110 transition-transform duration-300" />
        <span className="text-2xl font-bold text-white font-mono">
          {voteCount}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-stranger-red font-bold opacity-80 group-hover:opacity-100 transition-opacity">
        твой вклад
      </span>
    </div>
  );
}

