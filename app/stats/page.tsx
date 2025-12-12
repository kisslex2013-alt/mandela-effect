import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import StatsClientWrapper from './StatsClientWrapper';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mandela-effect.ru';

export const metadata: Metadata = {
  title: 'Статистика | Эффект Манделы',
  description: 'Глобальная статистика сбоев реальности.',
  alternates: {
    canonical: `${baseUrl}/stats`,
  },
};

// ISR: Статическая генерация с ревалидацией
export const revalidate = 120; // 2 минуты для страницы статистики

// Кэшированная функция для получения данных статистики
const getStatsData = unstable_cache(
  async () => {
    const [effects, totalVotes, uniqueVisitors] = await Promise.all([
      prisma.effect.findMany({
        where: { isVisible: true },
        select: { id: true, title: true, category: true, votesFor: true, votesAgainst: true, imageUrl: true },
      }),
      prisma.vote.count(),
      prisma.vote.groupBy({ by: ['visitorId'] }).then(res => res.length)
    ]);
    return { effects, totalVotes, totalParticipants: uniqueVisitors };
  },
  ['stats-page-data'],
  { revalidate: 120, tags: ['effects', 'stats'] }
);

export default async function StatsPage() {
  const data = await getStatsData();
  return <StatsClientWrapper {...data} />;
}
