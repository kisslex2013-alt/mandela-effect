import { Suspense } from 'react';
import { getEffects, getStats } from '@/app/actions/effects';
import HomeClient from './HomeClient';

// Серверный компонент - загружает данные
export default async function Home() {
  // Загружаем данные на сервере с обработкой ошибок
  let popularEffects = [];
  let newEffects = [];
  let stats = { totalEffects: 0, totalVotes: 0, totalViews: 0 };
  let mostControversial = null;

  try {
    [popularEffects, newEffects, stats] = await Promise.all([
      getEffects({ sort: 'popular', limit: 3 }),
      getEffects({ sort: 'newest', limit: 6 }),
      getStats(),
    ]);

    // Находим самый спорный эффект (где голоса ближе к 50/50)
    const allEffects = await getEffects({ limit: 50 });
    mostControversial = allEffects
      .filter(e => (e.votesFor + e.votesAgainst) > 0)
      .map(e => {
        const total = e.votesFor + e.votesAgainst;
        const percentA = (e.votesFor / total) * 100;
        const controversy = Math.abs(50 - percentA); // Чем ближе к 0, тем спорнее
        return { ...e, controversy, percentA, percentB: 100 - percentA, totalVotes: total };
      })
      .sort((a, b) => a.controversy - b.controversy)[0] || null;
  } catch (error) {
    console.error('[Home] Ошибка при загрузке данных:', error);
    // В случае ошибки используем пустые данные - компонент покажет empty state
  }

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-dark">
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-light/60">Загрузка...</div>
          </div>
        </main>
      }
    >
      <HomeClient
        initialStats={stats}
        popularEffects={popularEffects}
        newEffects={newEffects}
        mostControversial={mostControversial}
      />
    </Suspense>
  );
}
