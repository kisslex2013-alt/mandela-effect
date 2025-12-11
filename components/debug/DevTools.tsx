'use client';

import { useState } from 'react';
import { Terminal, X } from 'lucide-react';
import { cycleVotesForTesting } from '@/app/actions/dev-tools';
import { useReality } from '@/lib/context/RealityContext';
import toast from 'react-hot-toast';
import { getClientVisitorId } from '@/lib/client-visitor';

export default function DevTools() {
  // Виджет виден только в development режиме
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshVotes } = useReality();

  const handleCheat = async () => {
    setIsLoading(true);
    const vid = getClientVisitorId();
    if (!vid) {
      toast.error("Visitor ID не найден");
      setIsLoading(false);
      return;
    }

    const res = await cycleVotesForTesting(vid);
    
    if (res.success) {
      toast.success(`DEV: Голоса: ${res.count}`, { icon: '🛠️' });
      await refreshVotes();
    } else {
      toast.error("Ошибка DEV");
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-[100] font-mono text-xs">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-8 h-8 bg-black/50 backdrop-blur border border-white/10 rounded-full flex items-center justify-center text-white/20 hover:text-white hover:bg-black/80 transition-all"
          title="Open DevTools"
        >
          <Terminal className="w-4 h-4" />
        </button>
      ) : (
        <div className="bg-black/90 border border-white/20 rounded-lg p-3 shadow-2xl w-48 animate-in slide-in-from-bottom-2 fade-in">
          <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1">
            <span className="text-green-400 font-bold">DEV CONSOLE</span>
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleCheat}
              disabled={isLoading}
              className="w-full py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-left flex items-center justify-between group transition-colors disabled:opacity-50"
            >
              <span className="text-gray-300 group-hover:text-white">Cycle Votes</span>
              <span className="text-[10px] bg-white/10 px-1 rounded text-gray-500">0→24</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

