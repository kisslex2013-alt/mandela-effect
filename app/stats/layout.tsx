import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Статистика - Эффект Манделы',
  description: 'Общая статистика проекта, самые спорные и популярные эффекты',
  keywords: 'статистика эффекта манделы, популярные эффекты, спорные эффекты',
  alternates: {
    canonical: 'https://yourdomain.com/stats',
  },
  openGraph: {
    title: 'Статистика - Эффект Манделы',
    description: 'Общая статистика проекта, самые спорные и популярные эффекты',
    type: 'website',
    url: 'https://yourdomain.com/stats',
  },
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

