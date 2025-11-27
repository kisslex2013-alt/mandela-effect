import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Каталог эффектов Манделы - 150+ примеров',
  description: 'Полный каталог эффектов Манделы по категориям. Фильмы, музыка, бренды и многое другое.',
};

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

