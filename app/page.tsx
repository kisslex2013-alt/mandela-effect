import { Metadata } from 'next';
import { getHomeData } from '@/app/actions/effects';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    <HomeClient 
      trendingEffects={trending}
      newEffects={newEffects}
      topCategories={categories}
      globalStats={stats}
      effectOfDay={effectOfDay || undefined}
    />
  );
}
