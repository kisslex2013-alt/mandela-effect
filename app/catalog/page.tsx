import { Suspense } from 'react';
import { getEffects, getCategories } from '@/app/actions/effects';
import CatalogClient from './CatalogClient';
import ErrorState from '@/components/ErrorState';

// Серверный компонент - загружает данные
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  // Получаем параметры поиска
  const params = await searchParams;
  const initialCategory = params.category || null;

  // Загружаем данные на сервере с обработкой ошибок
  let effects, categories;
  try {
    [effects, categories] = await Promise.all([
      getEffects({ limit: 100 }),
      getCategories(),
    ]);
  } catch (error) {
    console.error('[CatalogPage] Ошибка при загрузке данных:', error);
    // Возвращаем страницу с ошибкой
    return (
      <main className="min-h-screen bg-dark py-8">
        <div className="max-w-6xl mx-auto px-4">
          <ErrorState
            title="Ошибка загрузки каталога"
            message="Не удалось загрузить эффекты. Попробуйте обновить страницу."
          />
        </div>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-dark py-8">
          <div className="max-w-6xl mx-auto px-4">
            {/* Заголовок скелетон */}
            <div className="mb-8">
              <div className="h-12 w-64 bg-darkCard/50 rounded animate-pulse"></div>
            </div>

            {/* Фильтры скелетон */}
            <div className="mb-8 flex flex-wrap gap-4">
              <div className="h-12 w-48 bg-darkCard/50 rounded animate-pulse"></div>
              <div className="h-12 w-48 bg-darkCard/50 rounded animate-pulse"></div>
              <div className="h-12 w-32 bg-darkCard/50 rounded animate-pulse"></div>
            </div>

            {/* Сетка карточек скелетон */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div 
                  key={i} 
                  className="bg-darkCard p-6 rounded-xl border border-light/10 animate-pulse"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-dark/50 rounded"></div>
                    <div className="h-6 w-32 bg-dark/50 rounded"></div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 w-full bg-dark/50 rounded"></div>
                    <div className="h-4 w-3/4 bg-dark/50 rounded"></div>
                  </div>
                  <div className="h-3 w-full bg-dark/50 rounded-full mb-3"></div>
                  <div className="flex justify-between mb-3">
                    <div className="h-4 w-12 bg-dark/50 rounded"></div>
                    <div className="h-4 w-12 bg-dark/50 rounded"></div>
                  </div>
                  <div className="h-5 w-24 bg-dark/50 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      }
    >
      <CatalogClient 
        initialEffects={effects} 
        categories={categories}
        initialCategory={initialCategory}
      />
    </Suspense>
  );
}
