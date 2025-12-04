'use client';

import { useState } from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';

interface SafeMediaLinkProps {
  url: string;
  type: 'image' | 'video' | 'audio';
  children?: React.ReactNode;
}

export function SafeMediaLink({ url, type, children }: SafeMediaLinkProps) {
  const [showWarning, setShowWarning] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    // Показываем предупреждение перед переходом
    if (!showWarning) {
      e.preventDefault();
      setShowWarning(true);
      return;
    }
    
    // Открываем безопасно
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className="relative">
      {showWarning ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-yellow-200 mb-2">
                Вы переходите на внешний сайт. Мы не контролируем содержимое внешних ссылок.
              </p>
              <div className="flex gap-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded border border-yellow-500/30"
                >
                  Перейти
                </a>
                <button
                  onClick={() => setShowWarning(false)}
                  className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {children || 'Открыть ссылку'}
          <ExternalLink className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

