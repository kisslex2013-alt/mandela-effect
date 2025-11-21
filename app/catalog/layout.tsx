import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Каталог эффектов Манделы - 150+ примеров',
  description: 'Полный каталог эффектов Манделы по категориям. Фильмы, музыка, бренды и многое другое.',
  keywords: 'каталог эффектов манделы, ложные воспоминания, коллективная память',
  alternates: {
    canonical: 'https://yourdomain.com/catalog',
  },
  openGraph: {
    title: 'Каталог эффектов Манделы',
    description: 'Полный каталог эффектов Манделы по категориям',
    type: 'website',
    url: 'https://yourdomain.com/catalog',
  },
};

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

