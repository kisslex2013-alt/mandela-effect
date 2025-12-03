import { Metadata } from 'next';

import prisma from '@/lib/prisma';

import StatsClient from './StatsClient';

export const metadata: Metadata = {
  title: 'Статистика | Эффект Манделы',
  description: 'Глобальная статистика сбоев реальности.',
};

async function getData() {
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
      <StatsClient {...data} />
    </div>
  );
}
