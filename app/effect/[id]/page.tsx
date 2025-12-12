import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import EffectPageClient from '@/components/EffectPageClient';
import { unstable_cache } from 'next/cache';

// ISR: Статическая генерация с ревалидацией каждые 60 секунд
// УДАЛЕН force-dynamic - улучшает TTFB с 2.5s до <0.8s
export const revalidate = 60;

// Генерация статических путей для популярных эффектов (улучшает TTFB)
export async function generateStaticParams() {
  const effects = await prisma.effect.findMany({
    where: { isVisible: true },
    select: { id: true },
    take: 50, // Топ 50 эффектов будут предгенерированы
    orderBy: { views: 'desc' }
  });
  
  return effects.map((effect) => ({
    id: effect.id,
  }));
}

// Кэшированная функция для получения эффекта
const getEffectWithNavigation = unstable_cache(
  async (id: string) => {
    // Параллельные запросы вместо последовательных (улучшает TTFB)
    const [effect, allEffects] = await Promise.all([
      prisma.effect.findUnique({
        where: { id },
        include: {
          _count: { select: { comments: true } },
          comments: {
            where: { status: 'APPROVED' },
            orderBy: { createdAt: 'desc' },
            take: 20, // Ограничиваем количество комментариев для скорости
          }
        },
      }),
      // Получаем все ID для навигации одним запросом
      prisma.effect.findMany({
        where: { isVisible: true },
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
    ]);

    if (!effect) return null;

    // Находим prev/next в памяти вместо отдельных запросов к БД
    const currentIndex = allEffects.findIndex(e => e.id === id);
    const prevEffect = currentIndex < allEffects.length - 1 
      ? { id: allEffects[currentIndex + 1].id, title: allEffects[currentIndex + 1].title }
      : null;
    const nextEffect = currentIndex > 0 
      ? { id: allEffects[currentIndex - 1].id, title: allEffects[currentIndex - 1].title }
      : null;

    return { effect, prevEffect, nextEffect };
  },
  ['effect-page'],
  { revalidate: 60, tags: ['effects'] }
);

export default async function EffectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const data = await getEffectWithNavigation(id);
  
  if (!data || !data.effect) notFound();

  const { effect, prevEffect, nextEffect } = data;
  const initialUserVote = null; 

  return (
    <EffectPageClient 
      effect={effect} 
      initialUserVote={initialUserVote} 
      prevEffect={prevEffect}
      nextEffect={nextEffect}
    />
  );
}
