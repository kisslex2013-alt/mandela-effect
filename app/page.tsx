import { Suspense } from 'react';
import { Metadata } from 'next';
import { getHomeDataCached } from '@/app/actions/effects';
import HomeClient from './HomeClient';
import Loading from '@/components/Loading';

// ISR: Статическая генерация с ревалидацией каждые 60 секунд
// УДАЛЕН force-dynamic - он убивал кэширование и увеличивал TTFB до 2.5s
export const revalidate = 60;

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mandela-effect.ru';

export const metadata: Metadata = {
  title: 'Эффект Манделы | Главная',
  description: 'Исследуй коллективные ложные воспоминания. Голосуй и проверяй свою реальность.',
  alternates: {
    canonical: baseUrl,
  },
};

export default async function Home() {
  const result = await getHomeDataCached();
  
  // Безопасная распаковка данных
  const trending = result.success && result.data ? result.data.trending : [];
  const newEffects = result.success && result.data ? result.data.newEffects : [];
  const categories = result.success && result.data ? result.data.categories : [];
  const stats = result.success && result.data ? result.data.stats : { totalEffects: 0, totalVotes: 0, totalParticipants: 0 };
  const effectOfDay = result.success && result.data ? result.data.effectOfDay : null;

  return (
    <Suspense fallback={<Loading />}>
      <HomeClient 
        trendingEffects={trending}
        newEffects={newEffects}
        topCategories={categories}
        globalStats={stats}
        effectOfDay={effectOfDay || undefined}
      />
    </Suspense>
  );
}
