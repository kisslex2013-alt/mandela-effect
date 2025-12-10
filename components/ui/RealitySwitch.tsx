'use client';

import { useReality } from '@/lib/context/RealityContext';
import { Lock, RotateCw, Sun } from 'lucide-react'; // RotateCw для циклического движения
import { cn } from '@/lib/utils';

export default function RealitySwitch() {
  const { isUpsideDown, toggleReality, isUnlocked, voteCount, requiredVotes } = useReality();

  // Рассчитываем прогресс и стадию
  const progress = Math.min((voteCount / requiredVotes) * 100, 100);
  
  // Стадии:
  // 0: Начало (0-9) - Серый, спокойный
  // 1: Искра (10-19) - Циан, легкое свечение
  // 2: Нестабильность (20-24) - Фиолетовый, пульсация, тряска
  // 3: Прорыв (25+) - Красный, глитч, разблокировано
  let stage = 0;
  if (voteCount >= 25) stage = 3;
  else if (voteCount >= 20) stage = 2;
  else if (voteCount >= 10) stage = 1;

  // Текст и иконка зависят от режима
  const labelText = isUpsideDown 
    ? "В РЕАЛЬНОСТЬ" 
    : (stage === 3 ? "В ИЗНАНКУ" : "СИНХРОНИЗАЦИЯ");

  return (
    <div className="flex items-center gap-4 mr-2">
      {/* Текстовый индикатор (Скрыт на мобильных, чтобы не загромождать) */}
      <div className="hidden lg:flex flex-col items-end">
        <div className="inline-flex flex-col items-end">
          <div className={cn(
            "text-[10px] font-mono uppercase tracking-wider mb-1 transition-colors duration-300 whitespace-nowrap",
            stage === 0 && "text-white/30",
            stage === 1 && "text-cyan-400/80",
            stage === 2 && "text-purple-400 animate-pulse",
            stage === 3 && !isUpsideDown && "text-stranger-red font-bold",
            isUpsideDown && "text-yellow-200 font-bold text-shadow-glow" // Светлый текст в Изнанке
          )}>
            {labelText}
          </div>
          
          {/* Прогресс-бар (адаптивная ширина, соответствует ширине текста) */}
          <div className="flex gap-0.5 w-full">
            {Array.from({ length: 5 }).map((_, i) => {
              const isActive = (progress / 20) > i;
              return (
                <div 
                  key={i}
                  className={cn(
                    "h-1.5 rounded-sm transition-all duration-500 flex-1",
                    !isActive && "bg-white/10",
                    isActive && stage === 0 && "bg-white/40",
                    isActive && stage === 1 && "bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]",
                    isActive && stage === 2 && "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]",
                    isActive && stage === 3 && !isUpsideDown && "bg-stranger-red shadow-[0_0_10px_rgba(197,30,58,1)]",
                    isActive && isUpsideDown && "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" // Желтый в Изнанке
                  )}
                  style={{ minWidth: '4px' }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Кнопка-Рубильник */}
      <button
        onClick={toggleReality}
        disabled={!isUnlocked}
        className={cn(
          "relative group flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all duration-500",
          // Обычные стадии
          stage === 0 && "bg-white/5 border-white/10 text-white/30 cursor-not-allowed",
          stage === 1 && "bg-cyan-950/30 border-cyan-500/30 text-cyan-400 cursor-not-allowed hover:border-cyan-500/50",
          stage === 2 && "bg-purple-950/30 border-purple-500/50 text-purple-400 cursor-not-allowed animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.2)]",
          
          // Готов к переходу (Красный)
          stage === 3 && !isUpsideDown && "bg-stranger-red/10 border-stranger-red text-stranger-red cursor-pointer animate-bounce-slight shadow-[0_0_20px_rgba(197,30,58,0.4)] hover:bg-stranger-red/20 hover:scale-105",
          
          // В ИЗНАНКЕ (Светлая кнопка "Домой")
          isUpsideDown && "bg-yellow-500/10 border-yellow-400 text-yellow-400 cursor-pointer shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:bg-yellow-500/20 hover:scale-105 hover:shadow-[0_0_30px_rgba(250,204,21,0.5)]"
        )}
      >
        {/* Иконка */}
        <div className={cn(
          "relative z-10 transition-transform duration-300",
          stage === 2 && "animate-shake",
          isUpsideDown && "rotate-0"
        )}>
          {stage < 3 ? (
            <Lock className={cn("w-5 h-5", stage === 2 && "animate-pulse")} />
          ) : isUpsideDown ? (
            <Sun className="w-6 h-6 animate-spin-slow" /> // Солнышко
          ) : (
            <RotateCw className="w-6 h-6" /> // Циклическое движение
          )}
        </div>

        {/* Эффекты фона */}
        {stage >= 1 && (
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <div className={cn(
              "absolute inset-0 opacity-20",
              stage === 1 && "bg-cyan-500",
              stage === 2 && "bg-purple-500 animate-pulse",
              stage === 3 && !isUpsideDown && "bg-stranger-red animate-pulse-fast",
              isUpsideDown && "bg-yellow-400"
            )} />
          </div>
        )}

        {/* Глитч-эффект при наведении на разблокированную кнопку */}
        {stage === 3 && (
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-stranger-red/20 animate-glitch-1" />
            <div className="absolute top-0 left-0 w-full h-full bg-blue-500/20 animate-glitch-2" />
          </div>
        )}
      </button>
    </div>
  );
}
