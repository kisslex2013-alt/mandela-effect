import { Suspense } from 'react';
import { Metadata } from 'next';
import { getCatalogDataCached } from '@/app/actions/effects';
import CatalogClient from './CatalogClient';
import Loading from '@/components/Loading';

// ISR: Статическая генерация с ревалидацией каждые 60 секунд
// УДАЛЕН force-dynamic - улучшает TTFB
export const revalidate = 60;

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mandela-effect.ru';

export const metadata: Metadata = {
  title: 'Каталог | Эффект Манделы',
  description: 'Полный архив сбоев реальности. Ищите, голосуйте, проверяйте свою память.',
  alternates: {
    canonical: `${baseUrl}/catalog`,
  },
};

export default async function CatalogPage() {
  const result = await getCatalogDataCached();
  
  const effects = result.success && result.data ? result.data.effects : [];
  const categories = result.success && result.data ? result.data.categories : [];

  return (
    <Suspense fallback={<Loading />}>
      <CatalogClient 
        initialEffects={effects} 
        categories={categories} 
      />
    </Suspense>
  );
}
