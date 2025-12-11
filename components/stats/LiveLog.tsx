'use client';

import { useState, useEffect } from 'react';
import { useReality } from '@/lib/context/RealityContext';
import { Terminal, AlertTriangle, Activity } from 'lucide-react';

const LOG_TEMPLATES = {
  reality: [
    "Синхронизация ноосферы...",
    "Проверка целостности данных...",
    "Новый голос зарегистрирован: ID-####",
    "Сектор 7: Стабильно",
    "Обновление кэша памяти...",
    "Мониторинг отклонений: 0.001%",
    "Архивация воспоминаний..."
  ],
  upsideDown: [
    "КРИТИЧЕСКИЙ СБОЙ В СЕКТОРЕ 7",
    "ОБНАРУЖЕНА АНОМАЛИЯ: КОД КРАСНЫЙ",
    "ВМЕШАТЕЛЬСТВО В ПАМЯТЬ: ID-####",
    "ПЕРЕЗАПИСЬ ИСТОРИИ...",
    "СВЯЗЬ ПОТЕРЯНА",
    "ОШИБКА: РЕАЛЬНОСТЬ НЕ НАЙДЕНА",
    "ВТОРЖЕНИЕ ИЗВНЕ"
  ]
};

export default function LiveLog() {
  const { isUpsideDown } = useReality();
  const [logs, setLogs] = useState<{ id: number, text: string, type: 'info' | 'error' }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const templates = isUpsideDown ? LOG_TEMPLATES.upsideDown : LOG_TEMPLATES.reality;
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      const text = randomTemplate.replace('####', Math.floor(Math.random() * 9999).toString());
      
      setLogs(prev => {
        const newLogs: { id: number, text: string, type: 'info' | 'error' }[] = [{ 
          id: Date.now(), 
          text, 
          type: (isUpsideDown ? 'error' : 'info') as 'info' | 'error'
        }, ...prev].slice(0, 8); // Храним только последние 8
        return newLogs;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isUpsideDown]);

  return (
    <div className={`h-full rounded-xl border p-4 flex flex-col ${
      isUpsideDown 
        ? 'bg-red-950/20 border-red-500/30' 
        : 'bg-black/40 border-white/10'
    }`} style={{ minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2 flex-shrink-0">
        <Terminal className={`w-4 h-4 ${isUpsideDown ? 'text-red-500' : 'text-cyan-400'}`} />
        <span className="text-xs font-mono uppercase tracking-widest text-light/60">
          СИСТЕМНЫЙ ЛОГ
        </span>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden font-mono text-[10px] md:text-xs" style={{ minHeight: 0, maxHeight: '100%' }}>
        {logs.length > 0 ? (
          logs.map(log => (
            <div key={log.id} className="animate-log-entry flex gap-2 items-start">
              <span className="opacity-30 whitespace-nowrap flex-shrink-0">[{new Date(log.id).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
              <span className={`${
                log.type === 'error' ? 'text-red-400' : 'text-green-400'
              }`}>
                {isUpsideDown ? '> ' : '$ '}
                <span className="break-words">{log.text}</span>
              </span>
            </div>
          ))
        ) : (
          <div className="text-light/30 text-center py-4">Ожидание данных...</div>
        )}
      </div>
    </div>
  );
}

