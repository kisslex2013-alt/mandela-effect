import { Metadata } from 'next';

import prisma from '@/lib/prisma';

import StatsClientWrapper from './StatsClientWrapper';

export const metadata: Metadata = {
  title: 'Статистика | Эффект Манделы',
  description: 'Глобальная статистика сбоев реальности.',
};

async function getData() {
  // Все данные берутся из одного источника (БД) для согласованности:
  // - effects: массив всех видимых эффектов с их голосами
  // - totalVotes: общее количество записей в таблице vote (используется для расчета индекса сдвига)
  // - totalParticipants: количество уникальных visitorId (используется для отображения участников)
  const [effects, totalVotes, uniqueVisitors] = await Promise.all([
    prisma.effect.findMany({
      where: { isVisible: true },
      select: { id: true, title: true, category: true, votesFor: true, votesAgainst: true, imageUrl: true },
    }),
    prisma.vote.count(),
    prisma.vote.groupBy({ by: ['visitorId'] }).then(res => res.length)
  ]);
  return { effects, totalVotes, totalParticipants: uniqueVisitors };
}

export default async function StatsPage() {
  const data = await getData();
  return (
    <div className="min-h-screen bg-dark pt-32">
      <StatsClientWrapper {...data} />
    </div>
  );
}
