'use client';

import dynamic from 'next/dynamic';
import Loading from '@/components/Loading';

// Динамический импорт StatsClient для избежания проблем с Recharts SSR
// Должен быть в Client Component, чтобы использовать ssr: false
const StatsClient = dynamic(() => import('./StatsClient'), {
  ssr: false,
  loading: () => <Loading />
});

interface Effect {
  id: string;
  title: string;
  category: string;
  votesFor: number;
  votesAgainst: number;
  imageUrl: string | null;
}

interface StatsClientWrapperProps {
  effects: Effect[];
  totalVotes: number;
  totalParticipants: number;
}

export default function StatsClientWrapper({ effects, totalVotes, totalParticipants }: StatsClientWrapperProps) {
  return <StatsClient effects={effects} totalVotes={totalVotes} totalParticipants={totalParticipants} />;
}

