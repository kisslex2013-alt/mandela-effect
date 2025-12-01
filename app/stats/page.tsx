'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/Skeleton';
import { getEffects, getStats } from '@/app/actions/effects';
import { getCategoryInfo } from '@/lib/constants';
import { Brain, Users, MessageSquare, Flame, Trophy, Activity, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';

interface Effect {
  id: string;
  category: string;
  categoryEmoji: string;
  categoryName: string;
  title: string;
  votesA: number;
  votesB: number;
}

interface CategoryStats {
  category: string;
  emoji: string;
  name: string;
  count: number;
}

// Компонент анимированного числа
function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(value * easeOut));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return <span>{displayValue.toLocaleString('ru-RU')}</span>;
}

// Компонент карточки статистики
function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-darkCard p-6 rounded-xl text-center border border-light/10">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-4xl font-bold text-light mb-2">
        <AnimatedNumber value={value} />
      </div>
      <div className="text-sm text-light/60">{label}</div>
    </div>
  );
}

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [stats, setStats] = useState({
    totalEffects: 0,
    totalVotes: 0,
    estimatedParticipants: 0,
    controversialCount: 0,
  });
  const [controversialEffects, setControversialEffects] = useState<Effect[]>([]);
  const [popularEffects, setPopularEffects] = useState<Effect[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        // Загружаем статистику и эффекты через Server Actions
        const [statsData, rawEffects] = await Promise.all([
          getStats(),
          getEffects({ limit: 1000 }),
        ]);
        
        // Преобразуем эффекты в нужный формат
        const allEffects: Effect[] = rawEffects.map((effect) => {
          const catInfo = getCategoryInfo(effect.category);
          return {
            id: effect.id,
            category: effect.category,
            categoryEmoji: catInfo.emoji,
            categoryName: catInfo.name,
            title: effect.title,
            votesA: effect.votesFor,
            votesB: effect.votesAgainst,
          };
        });
        
        setEffects(allEffects);

        // Используем статистику из БД (единый источник данных)
        const totalEffectsCount = statsData.totalEffects;
        const totalVotesCount = statsData.totalVotes;
        const totalParticipants = statsData.totalParticipants;

        // Подсчёт спорных эффектов (разница < 10%)
        let controversialCount = 0;
        const controversialList: Array<Effect & { difference: number }> = [];

        for (const effect of allEffects) {
          const total = effect.votesA + effect.votesB;
          if (total === 0) continue;

          const percentA = (effect.votesA / total) * 100;
          const percentB = (effect.votesB / total) * 100;
          const difference = Math.abs(percentA - percentB);

          if (difference < 10) {
            controversialCount++;
            controversialList.push({ ...effect, difference });
          }
        }

        // Топ-5 самых спорных (минимальная разница)
        const topControversial = controversialList
          .sort((a, b) => a.difference - b.difference)
          .slice(0, 5)
          .map(({ difference, ...effect }) => effect);

        // Топ-5 самых популярных (больше всего голосов)
        const topPopular = [...allEffects]
          .sort((a, b) => {
            const totalA = a.votesA + a.votesB;
            const totalB = b.votesA + b.votesB;
            return totalB - totalA;
          })
          .slice(0, 5);

        // Распределение по категориям
        const categoriesMap = new Map<string, CategoryStats>();
        for (const effect of allEffects) {
          const categoryId = effect.category;
          if (!categoriesMap.has(categoryId)) {
            categoriesMap.set(categoryId, {
              category: categoryId,
              emoji: effect.categoryEmoji,
              name: effect.categoryName,
              count: 0,
            });
          }
          const category = categoriesMap.get(categoryId)!;
          category.count++;
        }

        const categories = Array.from(categoriesMap.values()).sort(
          (a, b) => b.count - a.count
        );

        setStats({
          totalEffects: totalEffectsCount,
          totalVotes: totalVotesCount,
          estimatedParticipants: totalParticipants,
          controversialCount,
        });
        setControversialEffects(topControversial);
        setPopularEffects(topPopular);
        setCategoryStats(categories);
      } catch (error) {
        console.error('[StatsPage] Ошибка загрузки статистики:', error);
        setError(error instanceof Error ? error.message : 'Не удалось загрузить статистику');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <main id="main-content" className="min-h-screen bg-dark py-16 px-4" role="main">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="w-64 h-12 mx-auto mb-12" variant="rectangular" />
          
          {/* Скелетоны карточек статистики */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-darkCard p-6 rounded-xl text-center">
                <Skeleton className="w-12 h-12 mx-auto mb-2" variant="circular" />
                <Skeleton className="w-20 h-8 mx-auto mb-2" variant="rectangular" />
                <Skeleton className="w-24 h-4 mx-auto" variant="text" />
              </div>
            ))}
          </div>

          {/* Скелетоны секций */}
          <div className="space-y-12">
            {[...Array(3)].map((_, index) => (
              <div key={index}>
                <Skeleton className="w-48 h-8 mb-6" variant="rectangular" />
                <div className="bg-darkCard rounded-xl p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-dark/50 p-4 rounded-lg">
                      <Skeleton className="w-full h-6 mb-2" variant="rectangular" />
                      <Skeleton className="w-3/4 h-4 mb-2" variant="text" />
                      <Skeleton className="w-full h-3" variant="rectangular" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-dark py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-darkCard p-8 rounded-xl text-center border border-light/10">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-16 h-16 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-light mb-2">Ошибка загрузки статистики</h2>
            <p className="text-light/70 mb-6">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                window.location.reload();
              }}
              className="px-6 py-3 bg-primary text-light rounded-lg font-medium hover:bg-primary/80 transition-colors"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      </main>
    );
  }

  const maxCategoryCount = categoryStats[0]?.count || 1;

  return (
    <main className="min-h-screen bg-dark py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-light">
          Статистика проекта
        </h1>

        {/* Общие цифры */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <StatCard icon={<Brain className="w-10 h-10 text-primary" />} value={stats.totalEffects} label="Эффектов" />
          <StatCard icon={<Users className="w-10 h-10 text-secondary" />} value={stats.estimatedParticipants} label="Участников" />
          <StatCard icon={<MessageSquare className="w-10 h-10 text-amber-400" />} value={stats.totalVotes} label="Голосов" />
          <StatCard icon={<Flame className="w-10 h-10 text-red-400" />} value={stats.controversialCount} label="Спорных" />
        </div>

        {/* Топ-5 самых спорных */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-light mb-6">
            Самые спорные эффекты
          </h2>
          <div className="bg-darkCard rounded-xl p-6 space-y-4">
            {controversialEffects.map((effect, index) => {
              const total = effect.votesA + effect.votesB;
              const percentA = total > 0 ? Math.round((effect.votesA / total) * 100 * 10) / 10 : 0;
              const percentB = total > 0 ? Math.round((effect.votesB / total) * 100 * 10) / 10 : 0;
              const difference = Math.abs(percentA - percentB);
              const isVeryControversial = difference < 5;

              return (
                <Link
                  key={effect.id}
                  href={`/effect/${effect.id}`}
                  className="block bg-dark/50 p-4 rounded-lg hover:bg-dark/70 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-light">{effect.title}</h3>
                        {isVeryControversial && (
                          <span className="px-2 py-1 bg-secondary/20 text-secondary rounded-full text-xs font-semibold flex items-center gap-1">
                            <Flame className="w-3 h-3" /> Очень спорный
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-light/60 mb-2">
                        {percentA}% vs {percentB}% • {total.toLocaleString('ru-RU')} голос
                      </p>
                      <div className="relative h-3 bg-dark rounded-full overflow-hidden">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 ${percentA}%, #f59e0b ${percentA}%)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Топ-5 самых популярных */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-light mb-6">
            Самые популярные эффекты
          </h2>
          <div className="bg-darkCard rounded-xl p-6 space-y-4">
            {popularEffects.map((effect, index) => {
              const total = effect.votesA + effect.votesB;
              const percentA = total > 0 ? Math.round((effect.votesA / total) * 100 * 10) / 10 : 0;
              const percentB = total > 0 ? Math.round((effect.votesB / total) * 100 * 10) / 10 : 0;

              return (
                <Link
                  key={effect.id}
                  href={`/effect/${effect.id}`}
                  className="block bg-dark/50 p-4 rounded-lg hover:bg-dark/70 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-light mb-1">{effect.title}</h3>
                      <p className="text-sm text-light/60 mb-2">
                        {percentA}% vs {percentB}% • {total.toLocaleString('ru-RU')} голосов
                      </p>
                      <div className="relative h-3 bg-dark rounded-full overflow-hidden">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 ${percentA}%, #f59e0b ${percentA}%)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Распределение по категориям */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-light mb-6">
            Эффектов по категориям
          </h2>
          <div className="bg-darkCard rounded-xl p-6 space-y-4">
            {categoryStats.map((category) => {
              const widthPercent = (category.count / maxCategoryCount) * 100;

              return (
                <div key={category.category} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <span className="text-xl">{category.emoji}</span>
                    <span className="text-light font-medium">{category.name}</span>
                  </div>
                  <div className="flex-1 relative h-6 bg-dark rounded-full overflow-hidden">
                    <div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <div className="text-light font-semibold min-w-[40px] text-right">
                    {category.count}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

