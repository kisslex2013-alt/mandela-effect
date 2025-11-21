import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Моя карта памяти - Эффект Манделы',
  description: 'Твоя личная статистика и паттерны восприятия',
  keywords: 'моя память, личная статистика, эффект манделы, восприятие',
  alternates: {
    canonical: 'https://yourdomain.com/my-memory',
  },
  openGraph: {
    title: 'Моя карта памяти - Эффект Манделы',
    description: 'Твоя личная статистика и паттерны восприятия',
    type: 'website',
    url: 'https://yourdomain.com/my-memory',
  },
};

export default function MyMemoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

