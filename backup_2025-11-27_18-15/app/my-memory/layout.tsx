import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Моя карта памяти - Эффект Манделы',
  description: 'Твоя личная статистика и паттерны восприятия. Узнай, как часто ты в большинстве.',
};

export default function MyMemoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

