'use client';

import { useEffect, useState, useRef } from 'react';
import { useCountUp } from '@/lib/hooks/useCountUp';
import Link from 'next/link';

export default function Home() {
  const [isVisible, setIsVisible] = useState(true); // Начинаем с true для немедленного отображения
  const [stats, setStats] = useState({ totalEffects: 0, totalVotes: 0, estimatedParticipants: 0 });
  const [mostControversial, setMostControversial] = useState<any>(null);
  const [isSectionVisible, setIsSectionVisible] = useState(true); // Начинаем с true для немедленного отображения
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Загружаем статистику при монтировании компонента
    const loadStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Fallback значения если API не работает
          setStats({ totalEffects: 15, totalVotes: 48000, estimatedParticipants: 16000 });
        }
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        // Fallback значения
        setStats({ totalEffects: 15, totalVotes: 48000, estimatedParticipants: 16000 });
      }
    };

    // Загружаем самый спорный эффект
    const loadMostControversial = async () => {
      try {
        const response = await fetch('/api/most-controversial');
        if (response.ok) {
          const data = await response.json();
          console.log('Самый спорный эффект загружен:', data);
          setMostControversial(data);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Ошибка загрузки самого спорного эффекта:', response.status, errorData);
        }
      } catch (error) {
        console.error('Ошибка загрузки самого спорного эффекта:', error);
      }
    };

    loadStats();
    loadMostControversial();
  }, []);

  // Intersection Observer для fade-in анимации
  useEffect(() => {
    if (!mostControversial) {
      setIsSectionVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsSectionVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [mostControversial?.id]); // Используем только id для стабильности зависимостей

  const countEffects = useCountUp(stats.totalEffects, 2000);
  const countParticipants = useCountUp(stats.estimatedParticipants, 2000);
  const countVotes = useCountUp(stats.totalVotes, 2000);

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  return (
    <main className="min-h-screen">
      {/* Hero секция */}
      <section className="relative h-[70vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Градиентный фон с анимацией */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-darkCard to-dark animate-gradient-shift" />
        
        {/* Контент */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
          {/* Анимированный заголовок с градиентом */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 relative z-20">
            <span 
              className="inline-block bg-gradient-to-r from-[#3b82f6] to-[#f59e0b] bg-clip-text text-transparent"
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block',
              }}
            >
              Как ты помнишь?
            </span>
          </h1>

          {/* Подзаголовок */}
          <p className="text-xl md:text-2xl text-light/80 mb-12 max-w-2xl relative z-20">
            Все помнят по-разному. Исследуй различия в восприятии
          </p>

          {/* Живая статистика */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-lg md:text-xl text-light/90 relative z-20">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <span className="font-semibold">
                {countEffects.toLocaleString('ru-RU')} эффектов
              </span>
            </div>
            <span className="hidden md:inline text-light/40">•</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <span className="font-semibold">
                {countParticipants.toLocaleString('ru-RU')} участников
              </span>
            </div>
            <span className="hidden md:inline text-light/40">•</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🗳️</span>
              <span className="font-semibold">
                {countVotes.toLocaleString('ru-RU')} голосов
              </span>
            </div>
          </div>
        </div>

        {/* Стрелка вниз для hint к скроллу */}
        <button
          onClick={handleScrollDown}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce cursor-pointer bg-darkCard hover:bg-darkCard/80 transition-all shadow-lg border border-light/20"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Прокрутить вниз"
          type="button"
        >
          <svg
            className="w-4 h-4 text-light"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      </section>

      {/* Секция "Самое спорное" */}
      <section className="py-16 px-4 bg-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-light">
            Самое спорное сейчас 🔥
          </h2>

          {mostControversial ? (
            <div
              ref={sectionRef}
              className={`transition-all duration-1000 ${
                isSectionVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <Link href={`/effect/${mostControversial.id}`} className="block">
                <div 
                  className="bg-darkCard p-8 rounded-2xl hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 cursor-pointer"
                  style={{
                    border: '2px solid #ef4444', // border-red-500
                    borderColor: '#ef4444', // red-500
                  }}
                >
                  {/* Emoji категории + название эффекта */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{mostControversial.categoryEmoji}</span>
                    <h3 className="text-2xl md:text-3xl font-bold text-light">
                      {mostControversial.title}
                    </h3>
                  </div>

                  {/* Вопрос */}
                  <p className="text-lg md:text-xl text-light/90 mb-6">
                    {mostControversial.question}
                  </p>

                  {/* Варианты (только надписи) */}
                  <div className="flex justify-between mb-6 text-sm text-light/60">
                    <span>Вариант А</span>
                    <span>Вариант Б</span>
                  </div>

                  {/* Прогресс-бар с процентами */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold" style={{ color: '#3b82f6' }}>
                        {mostControversial.percentA}%
                      </span>
                      <span className="text-lg font-semibold" style={{ color: '#f59e0b' }}>
                        {mostControversial.percentB}%
                      </span>
                    </div>
                    
                    {/* Прогресс-бар */}
                    <div className="relative h-3 rounded-full bg-dark/50 overflow-visible">
                      {/* Полный градиентный фон (синий → оранжевый) */}
                      <div 
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'linear-gradient(to right, #3b82f6, #f59e0b)',
                        }}
                      />
                      
                      {/* Точка-маркер на границе */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-light rounded-full border-2 border-dark shadow-lg z-10"
                        style={{
                          left: `calc(${mostControversial.percentA}% - 8px)`,
                          borderColor: '#1a1a1a',
                        }}
                      />
                    </div>
                  </div>

                  {/* Общее количество голосов */}
                  <p className="text-center text-light/60 mb-6">
                    {mostControversial.totalVotes.toLocaleString('ru-RU')} голосов
                  </p>

                  {/* Кнопка */}
                  <div className="text-center">
                    <button 
                      className="text-light font-semibold px-6 py-3 rounded-lg hover:shadow-lg transition-all"
                      style={{
                        background: 'linear-gradient(to right, #3b82f6, #f59e0b)',
                      }}
                    >
                      Посмотреть и проголосовать →
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="text-center text-light/60 py-12">
              <p className="text-lg">Загрузка самого спорного эффекта...</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

