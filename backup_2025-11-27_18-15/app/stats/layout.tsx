import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Статистика - Эффект Манделы',
  description: 'Общая статистика проекта, самые спорные и популярные эффекты.',
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

