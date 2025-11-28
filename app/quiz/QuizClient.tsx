'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveVote } from '@/app/actions/votes';
import { getVisitorId } from '@/lib/visitor';
import { saveLocalVote } from '@/lib/visitor';
import Link from 'next/link';

// Тип Effect для квиза
interface Effect {
  id: string;
  title: string;
  question: string;
  variantA: string;
  variantB: string;
  votesA: number;
  votesB: number;
  category: string;
}

interface QuizClientProps {
  effects: Effect[];
}

export default function QuizClient({ effects }: QuizClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lastVoteVariant, setLastVoteVariant] = useState<'A' | 'B' | null>(null);
  const [score, setScore] = useState(0); // Сколько раз совпал с большинством

  const currentEffect = effects[currentIndex];
  const isFinished = currentIndex >= effects.length;

  const handleVote = async (variant: 'A' | 'B') => {
    if (showResult || !currentEffect) return;

    // Оптимистичный UI (сразу показываем результат)
    setLastVoteVariant(variant);
    setShowResult(true);

    // Получаем visitorId
    const visitorId = getVisitorId();
    if (!visitorId) {
      console.error('[Quiz] Не удалось получить visitorId');
      return;
    }

    // Отправляем голос на сервер через saveVote (сохраняет в БД и обновляет статистику)
    const result = await saveVote({
      visitorId,
      effectId: currentEffect.id,
      variant,
    });

    if (result.success) {
      // Сохраняем локальный бэкап
      saveLocalVote(currentEffect.id, variant, currentEffect.title);
      
      // Отправляем событие для обновления каталога
      window.dispatchEvent(new Event('voteUpdated'));
    }

    // Считаем очки (совпал с большинством?)
    const total = currentEffect.votesA + currentEffect.votesB + 1; // +1 наш голос
    const votesForVariant = variant === 'A' ? currentEffect.votesA + 1 : currentEffect.votesB + 1;
    const percent = (votesForVariant / total) * 100;

    if (percent >= 50) setScore((s) => s + 1);
  };

  const nextQuestion = () => {
    setShowResult(false);
    setLastVoteVariant(null);
    setCurrentIndex((i) => i + 1);
  };

  // Пустое состояние
  if (!effects || effects.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-dark">
        <h1 className="text-4xl font-bold mb-4 text-light">Квиз недоступен</h1>
        <p className="text-xl mb-8 text-light/80">Не удалось загрузить вопросы</p>
        <Link href="/catalog" className="bg-primary px-6 py-3 rounded-lg font-bold text-white">
          В каталог
        </Link>
      </div>
    );
  }

  // Экран завершения
  if (!currentEffect || isFinished) {
    const majorityPercent = effects.length > 0 ? Math.round((score / effects.length) * 100) : 0;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-dark">
        <h1 className="text-4xl font-bold mb-4 text-light">Квиз завершен! 🎉</h1>
        <p className="text-xl mb-2 text-light/80">
          Твой результат: ты согласился с большинством в{' '}
          <span className="text-primary font-bold">{score}</span> из{' '}
          <span className="font-bold">{effects.length}</span> случаев.
        </p>
        <p className="text-lg mb-8 text-light/60">
          Это <span className="text-primary font-bold">{majorityPercent}%</span> совпадений
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-primary px-6 py-3 rounded-lg font-bold text-white hover:bg-primary/90 transition-colors"
          >
            Сыграть еще раз
          </button>
          <Link
            href="/catalog"
            className="bg-darkCard border border-white/10 px-6 py-3 rounded-lg text-light hover:bg-darkCard/80 transition-colors"
          >
            В каталог
          </Link>
        </div>
      </div>
    );
  }

  const totalVotes = currentEffect.votesA + currentEffect.votesB + (showResult ? 1 : 0);
  const getPercent = (votes: number) => (totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0);

  // Проверяем, в большинстве ли пользователь
  const isWithMajority =
    lastVoteVariant === 'A'
      ? currentEffect.votesA + 1 >= currentEffect.votesB
      : currentEffect.votesB + 1 >= currentEffect.votesA;

  return (
    <div className="min-h-screen py-12 px-4 max-w-2xl mx-auto flex flex-col justify-center bg-dark">
      {/* Прогресс бар */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-light/60 mb-2">
          <span>
            Вопрос {currentIndex + 1} из {effects.length}
          </span>
          <span>Совпадений: {score}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / effects.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentEffect.id}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          className="bg-darkCard p-8 rounded-2xl border border-white/10 shadow-2xl"
        >
          {/* Заголовок */}
          <h3 className="text-lg font-semibold text-primary mb-2">{currentEffect.title}</h3>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-light">{currentEffect.question}</h2>

          <div className="space-y-4">
            {/* Кнопка А */}
            <button
              onClick={() => handleVote('A')}
              disabled={showResult}
              className={`w-full p-6 rounded-xl text-left transition-all relative overflow-hidden
                ${
                  showResult
                    ? lastVoteVariant === 'A'
                      ? 'ring-2 ring-blue-500 bg-blue-500/20'
                      : 'opacity-50'
                    : 'bg-white/5 hover:bg-white/10 hover:scale-[1.02]'
                }`}
            >
              <div className="relative z-10 flex justify-between items-center">
                <span className="text-lg font-medium text-light">{currentEffect.variantA}</span>
                {showResult && (
                  <span className="font-bold text-xl text-blue-400">
                    {getPercent(currentEffect.votesA + (lastVoteVariant === 'A' ? 1 : 0))}%
                  </span>
                )}
              </div>
              {showResult && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${getPercent(currentEffect.votesA + (lastVoteVariant === 'A' ? 1 : 0))}%`,
                  }}
                  transition={{ duration: 0.5 }}
                  className="absolute left-0 top-0 bottom-0 bg-blue-500/20"
                />
              )}
            </button>

            {/* Кнопка Б */}
            <button
              onClick={() => handleVote('B')}
              disabled={showResult}
              className={`w-full p-6 rounded-xl text-left transition-all relative overflow-hidden
                ${
                  showResult
                    ? lastVoteVariant === 'B'
                      ? 'ring-2 ring-yellow-500 bg-yellow-500/20'
                      : 'opacity-50'
                    : 'bg-white/5 hover:bg-white/10 hover:scale-[1.02]'
                }`}
            >
              <div className="relative z-10 flex justify-between items-center">
                <span className="text-lg font-medium text-light">{currentEffect.variantB}</span>
                {showResult && (
                  <span className="font-bold text-xl text-yellow-400">
                    {getPercent(currentEffect.votesB + (lastVoteVariant === 'B' ? 1 : 0))}%
                  </span>
                )}
              </div>
              {showResult && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${getPercent(currentEffect.votesB + (lastVoteVariant === 'B' ? 1 : 0))}%`,
                  }}
                  transition={{ duration: 0.5 }}
                  className="absolute left-0 top-0 bottom-0 bg-yellow-500/20"
                />
              )}
            </button>
          </div>

          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              {/* Бейдж результата */}
              <div
                className={`inline-block px-4 py-2 rounded-full mb-4 ${
                  isWithMajority
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}
              >
                {isWithMajority ? '👥 Ты с большинством!' : '✨ Редкая память!'}
              </div>

              <button
                onClick={nextQuestion}
                className="w-full bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
              >
                {currentIndex < effects.length - 1 ? 'Далее →' : 'Завершить'}
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Ссылка на выход */}
      <div className="mt-8 text-center">
        <Link href="/" className="text-light/50 hover:text-light transition-colors text-sm">
          ← Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
