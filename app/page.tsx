import { Suspense } from 'react';
import { Metadata } from 'next';
import { getHomeData } from '@/app/actions/effects';
import HomeClient from './HomeClient';
import Loading from '@/components/Loading';

// ISR: Обновление раз в 1 секунду (предотвращает infinite loop в dev)
export const dynamic = 'force-dynamic';
export const revalidate = 1;

export const metadata: Metadata = {
  title: 'Эффект Манделы | Главная',
  description: 'Исследуй коллективные ложные воспоминания. Голосуй и проверяй свою реальность.',
};

export default async function Home() {
  const result = await getHomeData();
  
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
