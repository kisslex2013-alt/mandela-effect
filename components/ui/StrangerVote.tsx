'use client';

import { motion } from 'framer-motion';
import { Disc, AlertTriangle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StrangerVoteProps {
  variantA: string;
  variantB: string;
  votesFor: number;
  votesAgainst: number;
  userVote: 'A' | 'B' | null;
  onVote: (variant: 'A' | 'B') => void;
  isVoting: boolean;
  onOpenCard?: () => void;
  openOnClick?: boolean;
}

export default function StrangerVote({
  variantA,
  variantB,
  votesFor,
  votesAgainst,
  userVote,
  onVote,
  isVoting,
  onOpenCard,
  openOnClick = false,
}: StrangerVoteProps) {
  const total = votesFor + votesAgainst;
  const showStats = !!userVote;
  
  const realPercentA = total === 0 ? 50 : Math.round((votesFor / total) * 100);
  const realPercentB = total === 0 ? 50 : Math.round((votesAgainst / total) * 100);

  const displayPercentA = showStats ? realPercentA : 50;
  const displayPercentB = showStats ? realPercentB : 50;

  const isMajorityA = realPercentA >= realPercentB;

  return (
    <div className="w-full space-y-1.5 font-sans">
      {/* ВАРИАНТ А */}
      <div 
        onClick={() => {
          if (onOpenCard && (openOnClick || !!userVote)) {
            onOpenCard();
            return;
          }
          if (!userVote && !isVoting) onVote('A');
        }}
        className={cn(
          "relative overflow-hidden rounded-lg border transition-all duration-300 group cursor-pointer select-none min-h-[48px] flex flex-col justify-center",
          userVote === 'A' 
            ? "bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]" 
            : "bg-dark/40 border-white/10 hover:border-red-500/60 hover:bg-red-950/20"
        )}
      >
        <div className="absolute inset-0 bg-dark/50 z-0" />
        <motion.div 
          initial={{ width: "50%" }}
          animate={{ width: `${displayPercentA}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "absolute inset-y-0 left-0 z-0 transition-opacity duration-500",
            showStats ? "bg-gradient-to-r from-red-900/90 to-red-600/90 opacity-100" : "bg-white/5 opacity-0"
          )}
        />
        {showStats && <motion.div initial={{ width: 0 }} animate={{ width: `${displayPercentA}%` }} className="absolute bottom-0 left-0 h-[2px] bg-red-500 shadow-[0_0_10px_#ef4444] z-10" />}

        <div className="relative z-10 px-3 py-1.5 flex justify-between items-center">
          <div className="flex items-center gap-2 flex-1 pr-2 min-w-0">
            <div className={cn(
              "w-6 h-6 shrink-0 rounded flex items-center justify-center text-xs font-black border transition-colors shadow-lg",
              userVote === 'A' ? "bg-red-600 text-white border-red-500" : "bg-white/5 text-red-500 border-red-500/30"
            )}>A</div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className={cn(
                "text-xs font-bold transition-colors leading-tight break-words pr-16",
                userVote === 'A' ? "text-white" : "text-gray-300 group-hover:text-white"
              )}>{variantA}</span>
              {userVote === 'A' && <span className="text-[8px] text-cyan-300 font-mono flex items-center gap-1 mt-0.5 animate-pulse uppercase tracking-widest drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"><Disc className="w-2 h-2" /> Записано</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            {showStats ? <span className="text-xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{realPercentA}%</span> : <Lock className="w-4 h-4 text-white/20" />}
          </div>
        </div>
        {showStats && isMajorityA && <div className="absolute top-1.5 right-12 pointer-events-none animate-in fade-in zoom-in duration-500"><div className="bg-red-600 text-white border border-white/20 font-black text-[8px] uppercase tracking-[0.1em] px-2 py-0.5 -rotate-2 shadow-[0_0_10px_rgba(220,38,38,0.6)]">ANOMALY</div></div>}
      </div>

      {/* ВАРИАНТ Б */}
      <div 
        onClick={() => {
          if (onOpenCard && (openOnClick || !!userVote)) {
            onOpenCard();
            return;
          }
          if (!userVote && !isVoting) onVote('B');
        }}
        className={cn(
          "relative overflow-hidden rounded-lg border transition-all duration-300 group cursor-pointer select-none min-h-[48px] flex flex-col justify-center",
          userVote === 'B' 
            ? "bg-cyan-950/40 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]" 
            : "bg-dark/40 border-white/10 hover:border-cyan-500/60 hover:bg-cyan-950/20"
        )}
      >
        <div className="absolute inset-0 bg-dark/50 z-0" />
        <motion.div 
          initial={{ width: "50%" }}
          animate={{ width: `${displayPercentB}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "absolute inset-y-0 left-0 z-0 transition-opacity duration-500",
            showStats ? "bg-gradient-to-r from-cyan-900/90 to-cyan-600/90 opacity-100" : "bg-white/5 opacity-0"
          )}
        />
        {showStats && <motion.div initial={{ width: 0 }} animate={{ width: `${displayPercentB}%` }} className="absolute bottom-0 left-0 h-[2px] bg-cyan-500 shadow-[0_0_10px_#06b6d4] z-10" />}

        <div className="relative z-10 px-3 py-1.5 flex justify-between items-center">
          <div className="flex items-center gap-2 flex-1 pr-2 min-w-0">
            <div className={cn(
              "w-6 h-6 shrink-0 rounded flex items-center justify-center text-xs font-black border transition-colors shadow-lg",
              userVote === 'B' ? "bg-cyan-600 text-white border-cyan-500" : "bg-white/5 text-cyan-500 border-cyan-500/30"
            )}>B</div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className={cn(
                "text-xs font-bold transition-colors leading-tight break-words pr-16",
                userVote === 'B' ? "text-white" : "text-gray-300 group-hover:text-white"
              )}>{variantB}</span>
              {userVote === 'B' && <span className="text-[8px] text-red-300 font-mono flex items-center gap-1 mt-0.5 animate-pulse uppercase tracking-widest drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]"><Disc className="w-2 h-2" /> Записано</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            {showStats ? <span className="text-xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{realPercentB}%</span> : <Lock className="w-4 h-4 text-white/20" />}
          </div>
        </div>
        {showStats && !isMajorityA && <div className="absolute top-1.5 right-12 pointer-events-none animate-in fade-in zoom-in duration-500"><div className="bg-cyan-600 text-white border border-white/20 font-black text-[8px] uppercase tracking-[0.1em] px-2 py-0.5 -rotate-2 shadow-[0_0_10px_rgba(6,182,212,0.6)]">REALITY</div></div>}
      </div>
    </div>
  );
}
