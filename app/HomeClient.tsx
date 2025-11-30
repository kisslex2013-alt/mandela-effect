'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCountUp } from '@/lib/hooks/useCountUp';
import { redirectToRandomEffect, getEffects, getStats, type EffectResult } from '@/app/actions/effects';
import { HomeEmptyState, EffectCardSkeleton, ControversialSkeleton } from '@/components/EmptyState';
import EffectCard from '@/components/EffectCard';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import { getCategoryInfo } from '@/lib/constants';

interface MostControversialEffect extends EffectResult {
  controversy: number;
  percentA: number;
  percentB: number;
  totalVotes: number;
}

export default function HomeClient() {
  // Состояния для данных
  const [stats, setStats] = useState({
    totalEffects: 0,
    totalVotes: 0,
    totalViews: 0,
    totalParticipants: 0,
  });
  const [popularEffects, setPopularEffects] = useState<EffectResult[]>([]);
  const [newEffects, setNewEffects] = useState<EffectResult[]>([]);
  const [mostControversial, setMostControversial] = useState<MostControversialEffect | null>(null);
  const [loading, setLoading] = useState(true);
  const [votedEffectIds, setVotedEffectIds] = useState<string[]>([]);
  const [userStats, setUserStats] = useState({
    voted: 0,
    inMajority: 0,
    inMinority: 0,
    uniqueMemory: 0,
  });

  // Загрузка голосов (для синхронизации с каталогом)
  const loadVotes = async () => {
    const { getVisitorId } = await import('@/lib/visitor');
    const { getUserVotes } = await import('@/app/actions/votes');
    
    const visitorId = getVisitorId();
    const votedIds: string[] = [];

    // 1. Загружаем голоса из БД
    if (visitorId) {
      try {
        const serverVotes = await getUserVotes(visitorId);
        serverVotes.votes.forEach((vote) => {
          votedIds.push(vote.effectId);
        });
      } catch (error) {
        console.error('Ошибка загрузки голосов из БД:', error);
      }
    }

    // 2. Добавляем голоса из localStorage (fallback)
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('voted_effect_')) {
          const id = key.replace('voted_effect_', '');
          if (!votedIds.includes(id)) {
            votedIds.push(id);
          }
        }
      }
    }

    return votedIds;
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [popularData, newData, statsData, votedIds] = await Promise.all([
          getEffects({ sort: 'popular', limit: 3 }),
          getEffects({ sort: 'newest', limit: 6 }),
          getStats(),
          loadVotes(),
        ]);

        setPopularEffects(popularData);
        setNewEffects(newData);
        setStats(statsData);
        setVotedEffectIds(votedIds);

        // Находим самый спорный эффект
        const allEffects = await getEffects({ limit: 50 });
        const controversial = allEffects
          .filter(e => (e.votesFor + e.votesAgainst) > 0)
          .map(e => {
            const total = e.votesFor + e.votesAgainst;
            const percentA = (e.votesFor / total) * 100;
            const controversy = Math.abs(50 - percentA);
            return { ...e, controversy, percentA, percentB: 100 - percentA, totalVotes: total };
          })
          .sort((a, b) => a.controversy - b.controversy)[0] || null;

        setMostControversial(controversial);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Слушаем события обновления голосов
    const handleVoteUpdate = async () => {
      const votedIds = await loadVotes();
      setVotedEffectIds(votedIds);
    };
    
    window.addEventListener('voteUpdated', handleVoteUpdate);

    return () => {
      window.removeEventListener('voteUpdated', handleVoteUpdate);
    };
  }, []);

  // Загрузка статистики пользователя
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        // Получаем visitorId
        const { getVisitorId } = await import('@/lib/visitor');
        const visitorId = getVisitorId();
        
        if (!visitorId) {
          return;
        }

        // Загружаем голоса из БД (единый источник данных)
        const { getUserVotes: getUserVotesFromDB } = await import('@/app/actions/votes');
        let serverVotesData;
        try {
          serverVotesData = await getUserVotesFromDB(visitorId);
        } catch (error) {
          console.error('Ошибка загрузки голосов из БД:', error);
          serverVotesData = { totalVotes: 0, votes: [] };
        }

        // Также загружаем из localStorage как fallback
        const localVotes: Array<{ effectId: string; variant: 'A' | 'B' }> = [];
        if (typeof window !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('voted_effect_')) {
              const effectId = key.replace('voted_effect_', '');
              const voteDataStr = localStorage.getItem(key);
              if (!voteDataStr) continue;
              try {
                const voteData = JSON.parse(voteDataStr);
                if (voteData.variant && (voteData.variant === 'A' || voteData.variant === 'B')) {
                  localVotes.push({ effectId, variant: voteData.variant });
                }
              } catch {
                // Игнорируем ошибки парсинга
              }
            }
          }
        }

        // Объединяем голоса: сначала БД, потом localStorage (БД имеет приоритет)
        const allVotesMap = new Map<string, { effectId: string; variant: 'A' | 'B' }>();
        
        // Добавляем голоса из БД
        serverVotesData.votes.forEach((vote) => {
          allVotesMap.set(vote.effectId, {
            effectId: vote.effectId,
            variant: vote.variant as 'A' | 'B',
          });
        });
        
        // Добавляем голоса из localStorage (если их нет в БД)
        localVotes.forEach((vote) => {
          if (!allVotesMap.has(vote.effectId)) {
            allVotesMap.set(vote.effectId, { effectId: vote.effectId, variant: vote.variant });
          }
        });

        const uniqueVotedCount = allVotesMap.size;
        if (uniqueVotedCount === 0) return;

        // Загружаем ВСЕ эффекты из БД для правильного подсчета статистики (как в "Моя память")
        const { getEffects } = await import('@/app/actions/effects');
        const allEffectsRaw = await getEffects({ limit: 1000 });
        
        // Создаем Map для быстрого доступа
        const effectsMap = new Map<string, EffectResult>();
        allEffectsRaw.forEach((effect) => {
          effectsMap.set(effect.id, effect);
        });

        let inMajority = 0;
        let inMinority = 0;
        let uniqueMemory = 0;

        allVotesMap.forEach(({ effectId, variant }) => {
          const effect = effectsMap.get(effectId);
          if (!effect) return;

          const totalVotes = effect.votesFor + effect.votesAgainst;
          if (totalVotes === 0) return;

          // Правильная проверка: в большинстве ли пользователь
          // Если пользователь выбрал A, то он в большинстве если votesFor > votesAgainst
          // Если пользователь выбрал B, то он в большинстве если votesAgainst > votesFor
          const isInMajority = variant === 'A' 
            ? effect.votesFor > effect.votesAgainst
            : effect.votesAgainst > effect.votesFor;

          if (isInMajority) {
            inMajority++;
          } else {
            // Если не в большинстве, то в меньшинстве
            inMinority++;
          }
        });

        setUserStats({
          voted: uniqueVotedCount,
          inMajority,
          inMinority,
          uniqueMemory,
        });
      } catch (error) {
        console.error('Ошибка загрузки статистики пользователя:', error);
      }
    };

    loadUserStats();
  }, [popularEffects, newEffects]);

  // Анимированные счётчики
  const countEffects = useCountUp(stats.totalEffects, 800, stats.totalEffects > 0);
  const countParticipants = useCountUp(stats.totalParticipants, 800, stats.totalParticipants > 0);
  const countVotes = useCountUp(stats.totalVotes, 800, stats.totalVotes > 0);

  // Скелетон для статистики
  const StatSkeleton = () => (
    <span className="inline-block h-8 w-24 bg-white/10 animate-pulse rounded" />
  );

  return (
    <main id="main-content" className="min-h-screen" role="main">
      {/* Hero секция */}
      <section className="min-h-screen flex flex-col justify-center items-center px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-darkCard to-dark" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ willChange: "transform, opacity" }}
          className="relative z-10 flex flex-col items-center justify-center text-center max-w-4xl mx-auto"
        >
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            style={{ willChange: "transform, opacity" }}
          >
            Как ты помнишь?
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-light/90 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Все помнят по-разному. Исследуй различия в восприятии
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-8 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ willChange: "transform, opacity" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <span className="font-semibold text-lg md:text-xl text-light/90">
                {loading ? <StatSkeleton /> : `${countEffects.toLocaleString('ru-RU')} эффектов`}
              </span>
            </div>

            <span className="hidden md:inline text-light/40">•</span>

            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <span className="font-semibold text-lg md:text-xl text-light/90">
                {loading ? <StatSkeleton /> : `${countParticipants.toLocaleString('ru-RU')} участников`}
              </span>
            </div>

            <span className="hidden md:inline text-light/40">•</span>

            <div className="flex items-center gap-2">
              <span className="text-2xl">🗳️</span>
              <span className="font-semibold text-lg md:text-xl text-light/90">
                {loading ? <StatSkeleton /> : `${countVotes.toLocaleString('ru-RU')} голосов`}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Стрелка вниз */}
        <motion.div
          className="absolute bottom-24 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ willChange: "transform" }}
        >
          <button
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            className="w-12 h-12 rounded-full border-2 border-light/30 flex items-center justify-center hover:border-primary hover:bg-primary/10 transition-all"
            aria-label="Прокрутить вниз"
          >
            <svg
              className="w-6 h-6 text-light/60"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </motion.div>
      </section>

      {/* Самое спорное */}
      <section className="py-16 px-4 bg-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-light">
            Самое спорное сейчас 🔥
          </h2>

          {loading ? (
            <ControversialSkeleton />
          ) : mostControversial ? (
            <Link href={`/effect/${mostControversial.id}`} className="block">
              <div className="bg-darkCard rounded-2xl border-2 border-red-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 cursor-pointer overflow-hidden">
                {/* Изображение */}
                {mostControversial.imageUrl && (
                  <div className="relative w-full h-64 md:h-80">
                    <ImageWithSkeleton
                      src={mostControversial.imageUrl}
                      alt={mostControversial.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{getCategoryInfo(mostControversial.category).emoji}</span>
                    <h3 className="text-2xl md:text-3xl font-bold text-light">
                      {mostControversial.title}
                    </h3>
                  </div>

                  <p className="text-lg md:text-xl text-light/90 mb-6">
                    {mostControversial.description}
                  </p>

                <div className="flex justify-between mb-6 text-sm text-light/60">
                  <span>Вариант А</span>
                  <span>Вариант Б</span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-primary">
                      {Math.round(mostControversial.percentA)}%
                    </span>
                    <span className="text-lg font-semibold text-secondary">
                      {Math.round(mostControversial.percentB)}%
                    </span>
                  </div>

                  <div className="relative h-3 rounded-full bg-dark/50">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: 'linear-gradient(to right, #3b82f6, #f59e0b)' }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-light rounded-full border-2 border-dark shadow-lg z-10"
                      style={{ left: `calc(${mostControversial.percentA}% - 8px)` }}
                    />
                  </div>
                </div>

                  <p className="text-center text-light/60 mb-6">
                    {mostControversial.totalVotes.toLocaleString('ru-RU')} голосов
                  </p>

                  <div className="text-center">
                    <button
                      className="text-light font-semibold px-6 py-3 rounded-lg hover:shadow-lg transition-all"
                      style={{ background: 'linear-gradient(to right, #3b82f6, #f59e0b)' }}
                    >
                      Посмотреть и проголосовать →
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <ControversialSkeleton />
          )}
        </div>
      </section>

      {/* Новые эффекты */}
      <section className="py-16 px-4 bg-darkCard" aria-labelledby="new-effects-heading">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 id="new-effects-heading" className="text-3xl md:text-4xl font-bold text-light">
              Новые эффекты ✨
            </h2>
            <Link href="/catalog" className="text-primary hover:text-primary/80 transition-colors">
              Смотреть все →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <EffectCardSkeleton key={i} />
              ))}
            </div>
          ) : newEffects.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {newEffects.map((effect, index) => {
                const hasVoted = votedEffectIds.includes(effect.id);
                return (
                  <motion.div
                    key={effect.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  >
                    <EffectCard
                      id={effect.id}
                      title={effect.title}
                      description={effect.description}
                      category={effect.category}
                      categoryEmoji={getCategoryInfo(effect.category).emoji}
                      imageUrl={effect.imageUrl}
                      votesFor={effect.votesFor}
                      votesAgainst={effect.votesAgainst}
                      createdAt={effect.createdAt}
                      badge="Новое"
                      hasVoted={hasVoted}
                      priority={index < 2}
                      className="bg-dark border-light/10 hover:border-primary/50 hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.4)]"
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <EffectCardSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Популярное за неделю */}
      <section className="py-16 px-4 bg-dark" aria-labelledby="popular-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="popular-heading" className="text-3xl md:text-4xl font-bold mb-8 text-center text-light">
            Популярное за неделю 📈
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <EffectCardSkeleton key={i} />
              ))}
            </div>
          ) : popularEffects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {popularEffects.map((effect, index) => {
                const hasVoted = votedEffectIds.includes(effect.id);
                return (
                  <EffectCard
                    key={effect.id}
                    id={effect.id}
                    title={effect.title}
                    description={effect.description}
                    category={effect.category}
                    categoryEmoji={getCategoryInfo(effect.category).emoji}
                    imageUrl={effect.imageUrl}
                  votesFor={effect.votesFor}
                  votesAgainst={effect.votesAgainst}
                    badge={`#${index + 1}`}
                    showProgress={true}
                    hasVoted={hasVoted}
                    className="bg-darkCard border-2 border-light/10 hover:border-secondary/50 hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.4)]"
                  />
                );
              })}
            </div>
          ) : (
            <HomeEmptyState />
          )}
        </div>
      </section>

      {/* Твоя статистика */}
      {userStats.voted > 0 && (
        <section className="py-16 px-4 bg-darkCard" aria-labelledby="user-stats-heading">
          <div className="max-w-4xl mx-auto">
            <h2 id="user-stats-heading" className="text-3xl md:text-4xl font-bold mb-8 text-center text-light">
              Твоя статистика 📊
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark p-6 rounded-xl text-center transform transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-lg cursor-default">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-3xl font-bold text-primary mb-1">{userStats.voted}</div>
                <div className="text-sm text-light/60">Проголосовано</div>
              </div>

              <div className="bg-dark p-6 rounded-xl text-center transform transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-lg cursor-default">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-3xl font-bold text-blue-400 mb-1">{userStats.inMajority}</div>
                <div className="text-sm text-light/60">В большинстве</div>
              </div>

              <div className="bg-dark p-6 rounded-xl text-center transform transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-lg cursor-default">
                <div className="text-4xl mb-2">✨</div>
                <div className="text-3xl font-bold text-secondary mb-1">{userStats.inMinority}</div>
                <div className="text-sm text-light/60">В меньшинстве</div>
              </div>

              <div className="bg-dark p-6 rounded-xl text-center transform transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-lg cursor-default">
                <div className="text-4xl mb-2">🦄</div>
                <div className="text-3xl font-bold text-purple-400 mb-1">{userStats.uniqueMemory}</div>
                <div className="text-sm text-light/60">Уникальная память</div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/my-memory">
                <button className="px-6 py-3 bg-primary hover:bg-primary/80 text-light font-semibold rounded-lg transition-colors">
                  Подробная статистика →
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Быстрый старт */}
      <section className="py-16 px-4 bg-dark" aria-labelledby="quick-start-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="quick-start-heading" className="text-3xl md:text-4xl font-bold mb-12 text-center text-light">
            Быстрый старт 🚀
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <button
              onClick={() => redirectToRandomEffect()}
              className="w-72 h-32 bg-darkCard border-2 border-light/20 rounded-xl hover:border-secondary/50 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)] transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <span className="text-4xl">🎲</span>
              <span className="text-lg font-semibold text-light">Случайный эффект</span>
            </button>

            <Link href="/quiz">
              <button className="w-72 h-32 bg-darkCard border-2 border-light/20 rounded-xl hover:border-secondary/50 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)] transition-all duration-300 flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">📋</span>
                <span className="text-lg font-semibold text-light">Пройти тест</span>
              </button>
            </Link>

            <Link href="/catalog">
              <button className="w-72 h-32 bg-darkCard border-2 border-light/20 rounded-xl hover:border-secondary/50 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)] transition-all duration-300 flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">📚</span>
                <span className="text-lg font-semibold text-light">Весь каталог</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* О проекте */}
      <section className="py-16 px-4 bg-darkCard" aria-labelledby="about-heading">
        <div className="max-w-3xl mx-auto">
          <h2 id="about-heading" className="text-3xl md:text-4xl font-bold mb-8 text-center text-light">
            О проекте ℹ️
          </h2>

          <div className="bg-dark p-8 rounded-xl text-lg leading-relaxed text-light/90">
            <p className="mb-4">
              Эффект Манделы - это феномен ложных воспоминаний, когда множество людей помнят события
              или детали иначе, чем они есть на самом деле.
            </p>

            <p className="mb-4">Этот проект исследует, как по-разному люди помнят одно и то же.</p>

            <p className="text-yellow-400">
              ⚠️ Важно: нет правильных ответов - есть разные восприятия.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

