import { Suspense } from 'react';
import { Metadata } from 'next';
import { getCatalogData } from '@/app/actions/effects';
import CatalogClient from './CatalogClient';
import Loading from '@/components/Loading';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Отключаем кэш для проверки просмотров

export const metadata: Metadata = {
  title: 'Каталог | Эффект Манделы',
  description: 'Полный архив сбоев реальности. Ищите, голосуйте, проверяйте свою память.',
};

export default async function CatalogPage() {
  const result = await getCatalogData();
  
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
