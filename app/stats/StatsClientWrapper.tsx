'use client';

import dynamic from 'next/dynamic';
import Loading from '@/components/Loading';

// Динамический импорт StatsClient для избежания проблем с Recharts SSR
// Должен быть в Client Component, чтобы использовать ssr: false
const StatsClient = dynamic(() => import('./StatsClient'), {
  ssr: false,
  loading: () => <Loading />
});

interface StatsClientWrapperProps {
  stats: {
    totalEffects: number;
    totalVotes: number;
    totalViews: number;
    totalParticipants: number;
  };
}

export default function StatsClientWrapper({ stats }: StatsClientWrapperProps) {
  return <StatsClient stats={stats} />;
}

