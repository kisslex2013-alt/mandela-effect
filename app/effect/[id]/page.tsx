'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/Skeleton';

interface Effect {
  id: number;
  category: string;
  categoryEmoji: string;
  categoryName: string;
  title: string;
  question: string;
  variantA: string;
  variantB: string;
  votesA: number;
  votesB: number;
  currentState: string;
  sourceLink: string;
  dateAdded: string;
  percentA: number;
  percentB: number;
  totalVotes: number;
}

export default function EffectPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [effect, setEffect] = useState<Effect | null>(null);
  const [allEffects, setAllEffects] = useState<Effect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B' | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [progressA, setProgressA] = useState(0);
  const [progressB, setProgressB] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Загружаем все эффекты для навигации
        const allEffectsResponse = await fetch('/api/effects');
        if (allEffectsResponse.ok) {
          const allData = await allEffectsResponse.json();
          setAllEffects(allData);
        }

        // Загружаем текущий эффект
        const response = await fetch(`/api/effect/${id}`);
        if (response.ok) {
          const data = await response.json();
          setEffect(data);
          
          // Проверяем localStorage
          const votedKey = `voted_effect_${data.id}`;
          const votedStr = localStorage.getItem(votedKey);
          if (votedStr) {
            try {
              const voteData = JSON.parse(votedStr);
              const voted = typeof voteData === 'string' ? voteData : voteData.variant;
              setSelectedVariant(voted as 'A' | 'B');
              setHasVoted(true);
              setShowResults(true);
              // Устанавливаем финальные значения прогресс-баров
              setProgressA(data.percentA);
              setProgressB(data.percentB);
            } catch {
              // Fallback для старого формата
              setSelectedVariant(votedStr as 'A' | 'B');
              setHasVoted(true);
              setShowResults(true);
              setProgressA(data.percentA);
              setProgressB(data.percentB);
            }
          }
        } else if (response.status === 404) {
          router.push('/catalog');
        }
      } catch (error) {
        console.error('Ошибка загрузки эффекта:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, router]);

  const handleVote = async (variant: 'A' | 'B') => {
    if (!effect || hasVoted || isVoting) return;

    setIsVoting(true);

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          effectId: effect.id,
          variant,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Сохраняем в localStorage с timestamp и effectTitle
        const votedKey = `voted_effect_${effect.id}`;
        const voteData = {
          variant,
          timestamp: Date.now(),
          effectTitle: effect.title,
        };
        localStorage.setItem(votedKey, JSON.stringify(voteData));
        
        // Отправляем событие для обновления каталога
        window.dispatchEvent(new Event('voteUpdated'));
        
        // Обновляем состояние с данными из ответа
        setEffect({
          ...effect,
          ...data.effect,
        });
        
        setSelectedVariant(variant);
        setHasVoted(true);

        // Запускаем конфетти с цветом в зависимости от варианта
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: variant === 'A' ? ['#3b82f6'] : ['#f59e0b'],
        });

        toast.success('Голос учтён! ✓');

        // Анимация появления результатов
        setShowResults(true);
        
        // Анимация прогресс-баров от 0 до финального значения
        const targetA = data.effect.percentA;
        const targetB = data.effect.percentB;
        setProgressA(0);
        setProgressB(0);
        
        const duration = 800; // 0.8s
        const steps = 60;
        const stepDuration = duration / steps;
        let currentStep = 0;

        const animateProgress = () => {
          if (currentStep <= steps) {
            const progress = currentStep / steps;
            const easeOut = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setProgressA(targetA * easeOut);
            setProgressB(targetB * easeOut);
            currentStep++;
            setTimeout(animateProgress, stepDuration);
          } else {
            setProgressA(targetA);
            setProgressB(targetB);
          }
        };

        // Небольшая задержка перед началом анимации
        setTimeout(() => {
          animateProgress();
        }, 100);
      } else {
        toast.error('Что-то пошло не так. Попробуйте снова');
      }
    } catch (error) {
      console.error('Ошибка при голосовании:', error);
      toast.error('Что-то пошло не так. Попробуйте снова');
    } finally {
      setIsVoting(false);
    }
  };

  // Навигация
  const currentIndex = allEffects.findIndex((e) => e.id === id);
  const prevEffect = currentIndex > 0 ? allEffects[currentIndex - 1] : null;
  const nextEffect = currentIndex < allEffects.length - 1 ? allEffects[currentIndex + 1] : null;

  const handleRandomEffect = async () => {
    try {
      const response = await fetch('/api/random-effect');
      if (response.ok) {
        const data = await response.json();
        router.push(`/effect/${data.id}`);
      }
    } catch (error) {
      console.error('Ошибка загрузки случайного эффекта:', error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-dark py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Скелетон заголовка */}
          <div className="mb-12">
            <Skeleton className="w-16 h-6 mb-4" variant="text" />
            <Skeleton className="w-3/4 h-12 mx-auto mb-4" variant="rectangular" />
          </div>
          
          {/* Скелетон вопроса */}
          <Skeleton className="w-full h-8 mb-12" variant="text" />
          
          {/* Скелетоны вариантов */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
            <div className="bg-darkCard p-8 rounded-xl">
              <Skeleton className="w-24 h-6 mb-4" variant="text" />
              <Skeleton className="w-full h-20 mb-6" variant="rectangular" />
              <Skeleton className="w-full h-12" variant="rectangular" />
            </div>
            <div className="bg-darkCard p-8 rounded-xl">
              <Skeleton className="w-24 h-6 mb-4" variant="text" />
              <Skeleton className="w-full h-20 mb-6" variant="rectangular" />
              <Skeleton className="w-full h-12" variant="rectangular" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!effect) {
    return (
      <main className="min-h-screen bg-dark py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-light/60">
          <p className="text-lg mb-4">Эффект не найден</p>
          <Link href="/catalog" className="text-primary hover:text-secondary transition-colors">
            Вернуться в каталог
          </Link>
        </div>
      </main>
    );
  }

  if (!effect) {
    return null;
  }

  // Вычисляем проценты только если есть выбранный вариант
  const userPercent = hasVoted && selectedVariant ? (selectedVariant === 'A' ? effect.percentA : effect.percentB) : 0;
  const otherPercent = hasVoted && selectedVariant ? (selectedVariant === 'A' ? effect.percentB : effect.percentA) : 0;

  return (
    <main className="min-h-screen bg-dark py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Хлебные крошки */}
        <nav className="mb-8 text-sm text-light/60">
          <Link href="/" className="hover:text-light transition-colors">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/catalog?category=${effect.category}`}
            className="hover:text-light transition-colors"
          >
            {effect.categoryName}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-light">{effect.title}</span>
        </nav>

        {/* Заголовок */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{effect.categoryEmoji}</span>
            <span className="text-sm text-light/60">{effect.categoryName}</span>
          </div>
          <h1
            className="text-4xl font-bold mb-12 text-center"
            style={{
              background: 'linear-gradient(to right, #3b82f6, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {effect.title}
          </h1>
        </div>

        {/* Вопрос */}
        <p className="text-2xl text-center mb-12 text-light/90">
          {effect.question}
        </p>

        {/* ДО голосования - два блока рядом */}
        {!hasVoted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
            {/* Вариант A */}
            <div className="group bg-darkCard p-8 rounded-xl hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-lg font-semibold text-light mb-4">Вариант А</h3>
              <p className="text-xl text-center text-light/90 mb-6">{effect.variantA}</p>
              <button
                onClick={() => handleVote('A')}
                disabled={isVoting}
                className="w-full mt-6 px-6 py-3 bg-dark rounded-lg text-light font-semibold hover:bg-gradient-to-r hover:from-primary hover:to-secondary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVoting && (
                  <svg
                    className="animate-spin h-5 w-5 text-light"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {isVoting ? 'Отправка...' : 'Выбрать'}
              </button>
            </div>

            {/* Вариант B */}
            <div className="group bg-darkCard p-8 rounded-xl hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-lg font-semibold text-light mb-4">Вариант Б</h3>
              <p className="text-xl text-center text-light/90 mb-6">{effect.variantB}</p>
              <button
                onClick={() => handleVote('B')}
                disabled={isVoting}
                className="w-full mt-6 px-6 py-3 bg-dark rounded-lg text-light font-semibold hover:bg-gradient-to-r hover:from-primary hover:to-secondary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVoting && (
                  <svg
                    className="animate-spin h-5 w-5 text-light"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {isVoting ? 'Отправка...' : 'Выбрать'}
              </button>
            </div>
          </div>
        )}

        {/* ПОСЛЕ голосования - результаты */}
        {hasVoted && (
          <div
            className={`space-y-6 mb-8 transition-all duration-800 ease-out ${
              showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDuration: '0.8s' }}
          >
            {/* Вариант A */}
            <div
              className={`bg-darkCard p-8 rounded-xl transition-all duration-300 ${
                selectedVariant === 'A' ? 'border-2 border-primary' : ''
              }`}
            >
              <h3 className="text-lg font-semibold text-light mb-4">
                Вариант А: {effect.variantA}
              </h3>
              <div className="relative h-8 rounded-full bg-dark/50 overflow-hidden mb-4">
                <div
                  className="absolute inset-0 rounded-full transition-all duration-800 ease-out"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 ${showResults && progressA > 0 ? progressA : effect.percentA}%, #f59e0b ${showResults && progressA > 0 ? progressA : effect.percentA}%)`,
                    transitionDuration: '0.8s',
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-primary font-semibold">
                  {effect.percentA}% ({effect.votesA.toLocaleString('ru-RU')} голосов)
                </span>
                {selectedVariant === 'A' && (
                  <span className="text-primary font-semibold">👤 Ты здесь</span>
                )}
              </div>
            </div>

            {/* Вариант B */}
            <div
              className={`bg-darkCard p-8 rounded-xl transition-all duration-300 ${
                selectedVariant === 'B' ? 'border-2 border-primary' : ''
              }`}
            >
              <h3 className="text-lg font-semibold text-light mb-4">
                Вариант Б: {effect.variantB}
              </h3>
              <div className="relative h-8 rounded-full bg-dark/50 overflow-hidden mb-4">
                <div
                  className="absolute inset-0 rounded-full transition-all duration-800 ease-out"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 ${showResults && progressB > 0 ? progressB : effect.percentB}%, #f59e0b ${showResults && progressB > 0 ? progressB : effect.percentB}%)`,
                    transitionDuration: '0.8s',
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary font-semibold">
                  {effect.percentB}% ({effect.votesB.toLocaleString('ru-RU')} голосов)
                </span>
                {selectedVariant === 'B' && (
                  <span className="text-secondary font-semibold">👤 Ты здесь</span>
                )}
              </div>
            </div>

            {/* Сообщение после голосования */}
            <div className="bg-darkCard/50 p-6 rounded-xl mb-8">
              <p className="text-lg text-light mb-2">
                Вы выбрали: <span className="font-semibold">Вариант {selectedVariant || ''}</span>
              </p>
              <p className="text-light/80 mb-2">
                Так же помнят <span className="font-semibold text-primary">{userPercent}%</span>{' '}
                участников
              </p>
              <p className="text-light/80 mb-2">
                Другие <span className="font-semibold text-secondary">{otherPercent}%</span> помнят
                иначе - и это нормально.
              </p>
              <p className="text-light/80">Память у всех работает по-разному.</p>
            </div>

            {/* Бейдж "В большинстве" / "В меньшинстве" */}
            {selectedVariant && (
              <div className="mb-8 flex justify-center">
                {(() => {
                  const isInMajority =
                    selectedVariant === 'A'
                      ? effect.votesA > effect.votesB
                      : effect.votesB > effect.votesA;

                  if (isInMajority) {
                    return (
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/20 border border-primary/50 rounded-xl">
                        <span className="text-2xl">👥</span>
                        <span className="text-lg font-semibold text-primary">В большинстве</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-secondary/20 border border-secondary/50 rounded-xl">
                        <span className="text-2xl">✨</span>
                        <span className="text-lg font-semibold text-secondary">В меньшинстве</span>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {/* Текущее состояние (accordion) */}
            {effect.currentState && (
              <div className="mb-8">
                <button
                  onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                  className="w-full px-6 py-4 bg-darkCard rounded-xl text-left flex items-center justify-between hover:bg-darkCard/80 transition-all"
                >
                  <span className="text-lg font-semibold text-light">
                    Показать текущее состояние
                  </span>
                  <span
                    className={`text-light transition-transform ${
                      isAccordionOpen ? 'rotate-180' : ''
                    }`}
                  >
                    ▾
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isAccordionOpen ? 'max-h-96 mt-4' : 'max-h-0'
                  }`}
                >
                  <div className="bg-darkCard/50 p-6 rounded-xl">
                    <p className="text-light/80 mb-4">{effect.currentState}</p>
                    {effect.sourceLink && (
                      <a
                        href={effect.sourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-secondary transition-colors inline-flex items-center gap-2"
                      >
                        Источник
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Навигация */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-darkCard">
          <button
            onClick={() => prevEffect && router.push(`/effect/${prevEffect.id}`)}
            disabled={!prevEffect}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              prevEffect
                ? 'bg-darkCard text-light hover:bg-darkCard/80'
                : 'bg-darkCard/30 text-light/40 cursor-not-allowed'
            }`}
          >
            ← Предыдущий эффект
          </button>

          <button
            onClick={handleRandomEffect}
            className="px-6 py-3 rounded-lg font-semibold bg-darkCard text-light hover:bg-darkCard/80 transition-all"
          >
            🎲 Случайный
          </button>

          <button
            onClick={() => nextEffect && router.push(`/effect/${nextEffect.id}`)}
            disabled={!nextEffect}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              nextEffect
                ? 'bg-darkCard text-light hover:bg-darkCard/80'
                : 'bg-darkCard/30 text-light/40 cursor-not-allowed'
            }`}
          >
            Следующий эффект →
          </button>
        </div>
      </div>
    </main>
  );
}
