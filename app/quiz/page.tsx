'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Effect {
  id: number;
  category: string;
  categoryEmoji: string;
  categoryName: string;
  title: string;
  question: string;
  variantA: string;
  variantB: string;
}

interface QuizAnswer {
  effectId: number;
  variant: 'A' | 'B';
}

export default function QuizPage() {
  const router = useRouter();
  const [effects, setEffects] = useState<Effect[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const loadEffects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/effects');
        if (response.ok) {
          const data = await response.json();
          // Берем случайные 5 эффектов для теста
          const shuffled = data.sort(() => Math.random() - 0.5);
          setEffects(shuffled.slice(0, 5));
        }
      } catch (error) {
        console.error('Ошибка загрузки эффектов:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEffects();
  }, []);

  const handleAnswer = (variant: 'A' | 'B') => {
    const currentEffect = effects[currentIndex];
    const newAnswers = [...answers, { effectId: currentEffect.id, variant }];
    setAnswers(newAnswers);

    if (currentIndex < effects.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setShowResults(false);
    // Перемешиваем эффекты заново
    const shuffled = [...effects].sort(() => Math.random() - 0.5);
    setEffects(shuffled);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-dark py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-light/60">
          <p className="text-lg">Загрузка теста...</p>
        </div>
      </main>
    );
  }

  if (effects.length === 0) {
    return (
      <main className="min-h-screen bg-dark py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-light/60">
          <p className="text-lg mb-4">Не удалось загрузить эффекты</p>
          <Link href="/" className="text-primary hover:text-secondary transition-colors">
            Вернуться на главную
          </Link>
        </div>
      </main>
    );
  }

  if (showResults) {
    return (
      <main className="min-h-screen bg-dark py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center text-light">
            Тест завершен! 🎉
          </h1>
          <div className="bg-darkCard rounded-xl p-8 mb-8">
            <p className="text-xl text-light/80 mb-6 text-center">
              Вы ответили на {answers.length} из {effects.length} вопросов
            </p>
            <div className="flex flex-col gap-4 mb-8">
              {answers.map((answer, index) => {
                const effect = effects.find((e) => e.id === answer.effectId);
                if (!effect) return null;
                return (
                  <div key={index} className="bg-dark rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{effect.categoryEmoji}</span>
                      <span className="text-sm text-light/60">{effect.categoryName}</span>
                    </div>
                    <p className="text-light font-semibold mb-2">{effect.title}</p>
                    <p className="text-light/80 text-sm mb-2">{effect.question}</p>
                    <p className="text-primary text-sm">
                      Ваш ответ: {answer.variant === 'A' ? effect.variantA : effect.variantB}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-primary hover:bg-primary/80 text-light font-semibold rounded-lg transition-colors"
              >
                Пройти еще раз
              </button>
              <Link
                href="/catalog"
                className="px-6 py-3 bg-darkCard hover:bg-darkCard/80 text-light font-semibold rounded-lg transition-colors inline-block"
              >
                В каталог
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const currentEffect = effects[currentIndex];
  const progress = ((currentIndex + 1) / effects.length) * 100;

  return (
    <main className="min-h-screen bg-dark py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Прогресс */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-light/60">
              Вопрос {currentIndex + 1} из {effects.length}
            </span>
            <span className="text-light/60">{Math.round(progress)}%</span>
          </div>
          <div className="relative h-2 rounded-full bg-darkCard overflow-hidden">
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Вопрос */}
        <div className="bg-darkCard rounded-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{currentEffect.categoryEmoji}</span>
            <span className="text-lg text-light/60">{currentEffect.categoryName}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-light mb-4">
            {currentEffect.title}
          </h1>
          <p className="text-xl text-light/80 mb-8">
            {currentEffect.question}
          </p>

          {/* Варианты ответа */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer('A')}
              className="group p-6 rounded-xl border-2 border-darkCard bg-darkCard hover:border-primary hover:scale-105 transition-all duration-300 text-left"
            >
              <div className="text-2xl mb-2">A</div>
              <div className="text-lg font-semibold text-light">
                {currentEffect.variantA}
              </div>
            </button>

            <button
              onClick={() => handleAnswer('B')}
              className="group p-6 rounded-xl border-2 border-darkCard bg-darkCard hover:border-secondary hover:scale-105 transition-all duration-300 text-left"
            >
              <div className="text-2xl mb-2">B</div>
              <div className="text-lg font-semibold text-light">
                {currentEffect.variantB}
              </div>
            </button>
          </div>
        </div>

        {/* Навигация */}
        <div className="text-center">
          <Link
            href="/"
            className="text-light/60 hover:text-light transition-colors"
          >
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </main>
  );
}

