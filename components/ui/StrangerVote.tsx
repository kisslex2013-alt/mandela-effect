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
  onOpenCard?: () => void; // опционально: клик по варианту открывает карточку
  openOnClick?: boolean;   // если true: всегда открывать карточку вместо голосования
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
  // Если не голосовал - показываем 50/50 визуально, чтобы не спойлерить
  const showStats = !!userVote;
  
  const realPercentA = total === 0 ? 50 : Math.round((votesFor / total) * 100);
  const realPercentB = total === 0 ? 50 : Math.round((votesAgainst / total) * 100);

  const displayPercentA = showStats ? realPercentA : 50;
  const displayPercentB = showStats ? realPercentB : 50;

  const isMajorityA = realPercentA >= realPercentB;

  return (
    <div className="w-full space-y-2 font-sans">
      {/* ВАРИАНТ А (МАНДЕЛА / ИЗНАНКА - КРАСНЫЙ) */}
      <div 
        onClick={() => {
          if (onOpenCard && (openOnClick || !!userVote)) {
            onOpenCard();
            return;
          }
          if (!userVote && !isVoting) onVote('A');
        }}
        className={cn(
          "relative overflow-hidden rounded-lg border-2 transition-all duration-300 group cursor-pointer select-none min-h-[60px] flex flex-col justify-center",
          userVote === 'A' 
            ? "bg-red-950/40 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.4)]" 
            : "bg-dark/40 border-white/10 hover:border-red-500/60 hover:bg-red-950/20"
        )}
      >
        <div className="absolute inset-0 bg-dark/50 z-0" />
        
        {/* Полоса прогресса (Скрыта до голоса или 50% прозрачная) */}
        <motion.div 
          initial={{ width: "50%" }}
          animate={{ width: `${displayPercentA}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "absolute inset-y-0 left-0 z-0 transition-opacity duration-500",
            showStats ? "bg-gradient-to-r from-red-900/90 to-red-600/90 opacity-100" : "bg-white/5 opacity-0"
          )}
        />
        
        {/* Неоновая линия снизу */}
        {showStats && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${displayPercentA}%` }}
            className="absolute bottom-0 left-0 h-[3px] bg-red-500 shadow-[0_0_15px_#ef4444] z-10"
          />
        )}

        <div className="relative z-10 px-3 py-2 flex justify-between items-center">
          <div className="flex items-center gap-3 flex-1 pr-2">
            <div className={cn(
              "w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-base font-black border-2 transition-colors shadow-lg",
              userVote === 'A' ? "bg-red-600 text-white border-red-500" : "bg-white/5 text-red-500 border-red-500/30"
            )}>A</div>
            <div className="flex flex-col">
              <span className={cn(
                "text-sm font-bold transition-colors leading-tight",
                userVote === 'A' ? "text-white" : "text-gray-300 group-hover:text-white"
              )}>
                {variantA}
              </span>
              {userVote === 'A' && <span className="text-[9px] text-red-300 font-mono flex items-center gap-1 mt-0.5 animate-pulse uppercase tracking-widest"><Disc className="w-2.5 h-2.5" /> Записано</span>}
            </div>
          </div>
          
          <div className="text-right shrink-0">
            {showStats ? (
              <span className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {realPercentA}%
              </span>
            ) : (
              <Lock className="w-5 h-5 text-white/20" />
            )}
          </div>
        </div>

        {/* БЕЙДЖ ANOMALY (Яркий) */}
        {showStats && isMajorityA && (
          <div className="absolute top-2 right-16 pointer-events-none animate-in fade-in zoom-in duration-500">
            <div className="bg-red-600 text-white border-2 border-white/20 font-black text-[10px] uppercase tracking-[0.2em] px-3 py-1 -rotate-2 shadow-[0_0_15px_rgba(220,38,38,0.6)]">
              ANOMALY
            </div>
          </div>
        )}
      </div>

      {/* ВАРИАНТ Б (РЕАЛЬНОСТЬ / ХОЛОД - ЦИАН) */}
      <div 
        onClick={() => {
          if (onOpenCard && (openOnClick || !!userVote)) {
            onOpenCard();
            return;
          }
          if (!userVote && !isVoting) onVote('B');
        }}
        className={cn(
          "relative overflow-hidden rounded-lg border-2 transition-all duration-300 group cursor-pointer select-none min-h-[60px] flex flex-col justify-center",
          userVote === 'B' 
            ? "bg-cyan-950/40 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]" 
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
        
        {showStats && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${displayPercentB}%` }}
            className="absolute bottom-0 left-0 h-[3px] bg-cyan-500 shadow-[0_0_15px_#06b6d4] z-10"
          />
        )}

        <div className="relative z-10 px-3 py-2 flex justify-between items-center">
          <div className="flex items-center gap-3 flex-1 pr-2">
            <div className={cn(
              "w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-base font-black border-2 transition-colors shadow-lg",
              userVote === 'B' ? "bg-cyan-600 text-white border-cyan-500" : "bg-white/5 text-cyan-500 border-cyan-500/30"
            )}>B</div>
            <div className="flex flex-col">
              <span className={cn(
                "text-sm font-bold transition-colors leading-tight",
                userVote === 'B' ? "text-white" : "text-gray-300 group-hover:text-white"
              )}>
                {variantB}
              </span>
              {userVote === 'B' && <span className="text-[9px] text-cyan-300 font-mono flex items-center gap-1 mt-0.5 animate-pulse uppercase tracking-widest"><Disc className="w-2.5 h-2.5" /> Записано</span>}
            </div>
          </div>
          
          <div className="text-right shrink-0">
            {showStats ? (
              <span className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {realPercentB}%
              </span>
            ) : (
              <Lock className="w-5 h-5 text-white/20" />
            )}
          </div>
        </div>

        {/* БЕЙДЖ REALITY (Яркий) */}
        {showStats && !isMajorityA && (
          <div className="absolute top-2 right-16 pointer-events-none animate-in fade-in zoom-in duration-500">
            <div className="bg-cyan-600 text-white border-2 border-white/20 font-black text-[10px] uppercase tracking-[0.2em] px-3 py-1 -rotate-2 shadow-[0_0_15px_rgba(6,182,212,0.6)]">
              REALITY
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
