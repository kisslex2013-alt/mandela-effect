'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface SaveProgressProps {
  votesCount: number;
  compact?: boolean;
}

export default function SaveProgress({ votesCount, compact = false }: SaveProgressProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEmailClick = () => {
    toast('🚧 Вход через Email в разработке', {
      icon: '📧',
      duration: 3000,
      style: {
        background: '#1a1a2e',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
      },
    });
  };

  const handleGoogleClick = () => {
    toast('🚧 Вход через Google в разработке', {
      icon: '🔗',
      duration: 3000,
      style: {
        background: '#1a1a2e',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
      },
    });
  };

  const handleGithubClick = () => {
    toast('🚧 Вход через GitHub в разработке', {
      icon: '🐙',
      duration: 3000,
      style: {
        background: '#1a1a2e',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
      },
    });
  };

  if (compact) {
    return (
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-dark/50 border border-light/20 rounded-lg hover:border-primary/50 hover:bg-dark transition-all text-sm"
      >
        <span>☁️</span>
        <span className="text-light/80">Сохранить прогресс</span>
      </button>
    );
  }

  return (
    <>
      {/* Баннер предупреждения */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="text-light/90 font-medium mb-1">
              Данные хранятся только на этом устройстве
            </p>
            <p className="text-light/60 text-sm mb-3">
              У вас {votesCount} {votesCount === 1 ? 'голос' : votesCount < 5 ? 'голоса' : 'голосов'}. 
              Сохраните прогресс, чтобы не потерять его при очистке браузера или смене устройства.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              ☁️ Сохранить прогресс
            </button>
          </div>
        </div>
      </motion.div>

      {/* Модальное окно */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Оверлей */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />

            {/* Модалка */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-darkCard rounded-2xl border border-light/10 shadow-2xl z-50 overflow-hidden"
            >
              {/* Заголовок */}
              <div className="p-6 border-b border-light/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-light">Сохранить прогресс</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-light/10 transition-colors"
                  >
                    <span className="text-light/60">✕</span>
                  </button>
                </div>
                <p className="text-light/60 text-sm mt-2">
                  Войдите, чтобы синхронизировать голоса между устройствами
                </p>
              </div>

              {/* Кнопки входа */}
              <div className="p-6 space-y-3">
                {/* Email */}
                <button
                  onClick={handleEmailClick}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-dark border border-light/20 rounded-xl hover:border-primary/50 hover:bg-dark/80 transition-all group"
                >
                  <span className="text-2xl">📧</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-light group-hover:text-primary transition-colors">
                      Войти через Email
                    </div>
                    <div className="text-xs text-light/50">Получите ссылку для входа</div>
                  </div>
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                    Скоро
                  </span>
                </button>

                {/* Google */}
                <button
                  onClick={handleGoogleClick}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-dark border border-light/20 rounded-xl hover:border-red-500/50 hover:bg-dark/80 transition-all group"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-light group-hover:text-red-400 transition-colors">
                      Войти через Google
                    </div>
                    <div className="text-xs text-light/50">Быстрый вход в один клик</div>
                  </div>
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                    Скоро
                  </span>
                </button>

                {/* GitHub */}
                <button
                  onClick={handleGithubClick}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-dark border border-light/20 rounded-xl hover:border-purple-500/50 hover:bg-dark/80 transition-all group"
                >
                  <svg className="w-6 h-6 text-light" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-light group-hover:text-purple-400 transition-colors">
                      Войти через GitHub
                    </div>
                    <div className="text-xs text-light/50">Для разработчиков</div>
                  </div>
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                    Скоро
                  </span>
                </button>
              </div>

              {/* Футер */}
              <div className="px-6 py-4 bg-dark/50 border-t border-light/10">
                <p className="text-xs text-light/40 text-center">
                  При входе ваши {votesCount} {votesCount === 1 ? 'голос' : votesCount < 5 ? 'голоса' : 'голосов'} будут 
                  автоматически привязаны к аккаунту
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Компактная версия для хедера или сайдбара
 */
export function SaveProgressBadge({ votesCount }: { votesCount: number }) {
  return <SaveProgress votesCount={votesCount} compact />;
}

