'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [stats, setStats] = useState({ 
    totalEffects: 0, 
    totalVotes: 0, 
    estimatedParticipants: 0 
  });
  const [mostControversial, setMostControversial] = useState<any>(null);

  useEffect(() => {
    // Загружаем статистику
    const loadStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setStats({ totalEffects: 15, totalVotes: 79000, estimatedParticipants: 26000 });
        }
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        setStats({ totalEffects: 15, totalVotes: 79000, estimatedParticipants: 26000 });
      }
    };

    // Загружаем самый спорный эффект
    const loadMostControversial = async () => {
      try {
        const response = await fetch('/api/most-controversial');
        if (response.ok) {
          const data = await response.json();
          setMostControversial(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки самого спорного эффекта:', error);
      }
    };

    loadStats();
    loadMostControversial();
  }, []);

  // Простая анимация чисел
  const useCountUp = (end: number) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      if (end === 0) return;
      
      let start = 0;
      const duration = 2000;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      
      return () => clearInterval(timer);
    }, [end]);
    
    return count;
  };

  const countEffects = useCountUp(stats.totalEffects);
  const countParticipants = useCountUp(stats.estimatedParticipants);
  const countVotes = useCountUp(stats.totalVotes);

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  return (
    <main className="min-h-screen">
      {/* Hero секция */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Градиентный фон */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-darkCard to-dark" />
        
        {/* Контент */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
          {/* Заголовок */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Как ты помнишь?
            </span>
          </h1>

          {/* Подзаголовок */}
          <p className="text-xl md:text-2xl text-light/80 mb-12 max-w-2xl">
            Все помнят по-разному. Исследуй различия в восприятии
          </p>

          {/* Статистика */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-lg md:text-xl text-light/90">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              {stats.totalEffects === 0 ? (
                <div className="h-7 w-32 bg-light/10 rounded animate-pulse"></div>
              ) : (
                <span className="font-semibold">
                  {countEffects.toLocaleString('ru-RU')} эффектов
                </span>
              )}
            </div>
            
            <span className="hidden md:inline text-light/40">•</span>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              {stats.estimatedParticipants === 0 ? (
                <div className="h-7 w-36 bg-light/10 rounded animate-pulse"></div>
              ) : (
                <span className="font-semibold">
                  {countParticipants.toLocaleString('ru-RU')} участников
                </span>
              )}
            </div>
            
            <span className="hidden md:inline text-light/40">•</span>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">🗳️</span>
              {stats.totalVotes === 0 ? (
                <div className="h-7 w-32 bg-light/10 rounded animate-pulse"></div>
              ) : (
                <span className="font-semibold">
                  {countVotes.toLocaleString('ru-RU')} голосов
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Стрелка вниз */}
        <button
          onClick={handleScrollDown}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce cursor-pointer bg-darkCard hover:bg-darkCard/80 transition-all shadow-lg border border-light/20 w-8 h-8 rounded-full flex items-center justify-center"
          aria-label="Прокрутить вниз"
        >
          <svg
            className="w-4 h-4 text-light"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
            <Link href={`/effect/${mostControversial.id}`} className="block">
              <div className="bg-darkCard p-8 rounded-2xl border-2 border-red-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 cursor-pointer">
                {/* Emoji + название */}
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

                {/* Варианты */}
                <div className="flex justify-between mb-6 text-sm text-light/60">
                  <span>Вариант А</span>
                  <span>Вариант Б</span>
                </div>

                {/* Прогресс-бар */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-primary">
                      {mostControversial.percentA}%
                    </span>
                    <span className="text-lg font-semibold text-secondary">
                      {mostControversial.percentB}%
                    </span>
                  </div>
                  
                  <div className="relative h-3 rounded-full bg-dark/50">
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'linear-gradient(to right, #3b82f6, #f59e0b)',
                      }}
                    />
                    
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-light rounded-full border-2 border-dark shadow-lg z-10"
                      style={{
                        left: `calc(${mostControversial.percentA}% - 8px)`,
                      }}
                    />
                  </div>
                </div>

                {/* Количество голосов */}
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
          ) : (
            <div className="bg-darkCard p-8 rounded-2xl border-2 border-darkCard animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-dark/50 rounded"></div>
                <div className="h-8 w-64 bg-dark/50 rounded"></div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="h-6 w-full bg-dark/50 rounded"></div>
                <div className="h-6 w-3/4 bg-dark/50 rounded"></div>
              </div>
              <div className="h-3 w-full bg-dark/50 rounded-full mb-4"></div>
              <div className="h-12 w-full bg-dark/50 rounded-lg"></div>
            </div>
          )}
        </div>
      </section>

      {/* Секция "Быстрый старт" */}
      <section className="py-16 px-4 bg-darkCard">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-light">
            Быстрый старт 🚀
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link href="/catalog">
              <button className="w-72 h-32 bg-darkCard border-2 border-light/20 rounded-xl hover:border-primary hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">🎲</span>
                <span className="text-lg font-semibold text-light">Случайный эффект</span>
              </button>
            </Link>

            <Link href="/catalog">
              <button className="w-72 h-32 bg-darkCard border-2 border-light/20 rounded-xl hover:border-primary hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">📋</span>
                <span className="text-lg font-semibold text-light">Пройти тест</span>
              </button>
            </Link>

            <Link href="/catalog">
              <button className="w-72 h-32 bg-darkCard border-2 border-light/20 rounded-xl hover:border-primary hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">📚</span>
                <span className="text-lg font-semibold text-light">Весь каталог</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Секция "О проекте" */}
      <section className="py-16 px-4 bg-dark">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-light">
            О проекте ℹ️
          </h2>

          <div className="bg-darkCard p-8 rounded-xl text-lg leading-relaxed text-light/90">
            <p className="mb-4">
              Эффект Манделы - это феномен ложных воспоминаний, когда множество людей 
              помнят события или детали иначе, чем они есть на самом деле.
            </p>
            
            <p className="mb-4">
              Этот проект исследует, как по-разному люди помнят одно и то же.
            </p>
            
            <p className="text-yellow-400">
              ⚠️ Важно: нет правильных ответов - есть разные восприятия.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

