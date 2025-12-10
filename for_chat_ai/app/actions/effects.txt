'use server';

import { Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

// Типы для параметров фильтрации
export interface GetEffectsParams {
  query?: string;           // Строка поиска
  category?: string;        // Фильтр по категории
  sort?: 'popular' | 'newest' | 'controversial' | 'views'; // Сортировка
  hideCompleted?: boolean;  // Только не пройденные
  completedIds?: string[];  // Массив ID пройденных эффектов (из localStorage клиента)
  limit?: number;           // Лимит записей
  offset?: number;          // Смещение для пагинации
}

// Тип для возвращаемого эффекта (сериализуемый - даты как строки)
export interface EffectResult {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  imageUrl: string | null;
  videoUrl: string | null;
  votesFor: number;
  votesAgainst: number;
  views: number;
  residue: string | null;
  residueSource: string | null;
  history: string | null;
  historySource: string | null;
  yearDiscovered: number | null;
  similarEffectIds: string[];
  interpretations: Prisma.JsonValue;
  // Дополнительные поля, извлекаемые из interpretations или null
  sourceLink?: string | null;
  scientificSource?: string | null;
  communitySource?: string | null;
  currentState: string | null; // <-- Обязательное поле
  createdAt: string;
  updatedAt: string;
  // Количество комментариев
  commentsCount?: number;
  commentsWithMediaCount?: number;
}

// Тип для сырых данных из Prisma (с Date)
interface PrismaEffect {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  imageUrl: string | null;
  videoUrl: string | null;
  votesFor: number;
  votesAgainst: number;
  views: number;
  residue: string | null;
  residueSource: string | null;
  history: string | null;
  historySource: string | null;
  yearDiscovered: number | null;
  similarEffectIds: string[];
  currentState: string | null; // <-- Добавлено
  interpretations: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

// Вспомогательная функция для сериализации эффекта
function serializeEffect(effect: PrismaEffect): EffectResult {
  // Безопасная сериализация interpretations (может быть null или любым JSON значением)
  let safeInterpretations: Prisma.JsonValue = null;
  let sourceLink: string | null = null;
  let scientificSource: string | null = null;
  let communitySource: string | null = null;
  let currentState: string | null = null;

  try {
    // Если interpretations не null, проверяем что это валидный JSON
    if (effect.interpretations !== null && effect.interpretations !== undefined) {
      // Если это уже сериализуемый объект, оставляем как есть
      safeInterpretations = effect.interpretations;
      
      // Извлекаем дополнительные поля из interpretations, если они там есть
      if (typeof safeInterpretations === 'object' && safeInterpretations !== null && !Array.isArray(safeInterpretations)) {
        const interpretations = safeInterpretations as Record<string, any>;
        
        // Извлекаем поля, если они есть в interpretations
        // Проверяем на наличие и что это строки
        if (interpretations.sourceLink && typeof interpretations.sourceLink === 'string') {
          sourceLink = interpretations.sourceLink;
        }
        if (interpretations.scientificSource && typeof interpretations.scientificSource === 'string') {
          scientificSource = interpretations.scientificSource;
        }
        if (interpretations.communitySource && typeof interpretations.communitySource === 'string') {
          communitySource = interpretations.communitySource;
        }
        if (interpretations.currentState && typeof interpretations.currentState === 'string') {
          currentState = interpretations.currentState;
        }
      }
    }
  } catch (error) {
    console.warn('[serializeEffect] Ошибка при обработке interpretations:', error);
    safeInterpretations = null;
  }

  return {
    ...effect,
    interpretations: safeInterpretations,
    sourceLink: sourceLink || null,
    scientificSource: scientificSource || null,
    communitySource: communitySource || null,
    // Используем currentState из БД, если есть, иначе из interpretations
    currentState: effect.currentState || currentState || null,
    createdAt: effect.createdAt.toISOString(),
    updatedAt: effect.updatedAt.toISOString(),
  };
}

/**
 * Получить список эффектов с фильтрацией и сортировкой
 */
export async function getEffects(params: GetEffectsParams = {}): Promise<EffectResult[]> {
  const {
    query,
    category,
    sort = 'popular',
    hideCompleted = false,
    completedIds = [],
    limit = 50,
    offset = 0,
  } = params;

  // Формируем условия фильтрации
  const where: Prisma.EffectWhereInput = {
    isVisible: true, // Показываем только видимые эффекты
  };

  // Поиск по названию и описанию (case insensitive)
  if (query && query.trim()) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
    ];
  }

  // Фильтр по категории
  if (category && category !== 'all') {
    where.category = category;
  }

  // Скрыть пройденные эффекты
  if (hideCompleted && completedIds.length > 0) {
    where.id = { notIn: completedIds };
  }

  // Формируем сортировку
  let orderBy: Prisma.EffectOrderByWithRelationInput = {};
  
  switch (sort) {
    case 'popular':
      // Сортировка по общему количеству голосов (votesFor + votesAgainst)
      // Prisma не поддерживает вычисляемые поля в orderBy, поэтому сортируем по votesFor
      orderBy = { votesFor: 'desc' };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'controversial':
      // Спорные - где голоса примерно равны (сложно в Prisma, упрощаем)
      orderBy = { votesAgainst: 'desc' };
      break;
    case 'views':
      orderBy = { views: 'desc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  try {
    // Проверяем подключение к БД
    const dbUrl = process.env.DATABASE_URL;
    const isPooler = dbUrl?.includes('pooler') || dbUrl?.includes(':6543');
    console.log(`[getEffects] DATABASE_URL использует ${isPooler ? 'Pooler' : 'Direct Connection'}`);
    
    const effects = await prisma.effect.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        category: true,
        imageUrl: true,
        videoUrl: true,
        votesFor: true,
        votesAgainst: true,
        views: true,
        residue: true,
        residueSource: true,
        history: true,
        historySource: true,
        yearDiscovered: true,
        similarEffectIds: true,
        currentState: true, // <-- Добавлено
        interpretations: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`[getEffects] ✅ Получено эффектов: ${effects.length}`);

    // Получаем количество комментариев для всех эффектов
    const effectIds = effects.map(e => e.id);
    const { getCommentsCountsBatch } = await import('@/app/actions/comments');
    const commentsCounts = await getCommentsCountsBatch(effectIds);

    // Сериализуем даты в строки для корректной передачи клиенту
    const serialized = effects.map(effect => {
      const serializedEffect = serializeEffect(effect);
      const counts = commentsCounts[effect.id] || { total: 0, withMedia: 0 };
      return {
        ...serializedEffect,
        commentsCount: counts.total,
        commentsWithMediaCount: counts.withMedia,
      };
    });
    console.log(`[getEffects] ✅ Сериализовано эффектов: ${serialized.length}`);
    
    return serialized;
  } catch (error) {
    console.error('[getEffects] ❌ ОШИБКА при получении эффектов:');
    console.error('[getEffects] Тип ошибки:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[getEffects] Сообщение:', error instanceof Error ? error.message : String(error));
    
    // Детальная информация об ошибке Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('[getEffects] Код ошибки:', (error as any).code);
    }
    if (error && typeof error === 'object' && 'meta' in error) {
      console.error('[getEffects] Meta:', (error as any).meta);
    }
    
    console.error('[getEffects] Stack:', error instanceof Error ? error.stack : 'N/A');
    
    // Возвращаем пустой массив вместо выброса ошибки для graceful degradation
    console.warn('[getEffects] ⚠️ Возвращаем пустой массив из-за ошибки');
    return [];
  }
}

/**
 * Получить эффект по ID
 */
export async function getEffectById(id: string): Promise<EffectResult | null> {
  try {
    // Запрашиваем все поля модели Effect (включая interpretations)
    // interpretations может содержать sourceLink, scientificSource, communitySource, currentState
    const effect = await prisma.effect.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        category: true,
        imageUrl: true,
        videoUrl: true,
        votesFor: true,
        votesAgainst: true,
        views: true,
        residue: true,
        residueSource: true,
        history: true,
        historySource: true,
        yearDiscovered: true,
        similarEffectIds: true,
        currentState: true, // <-- Добавлено
        interpretations: true, // JSON поле, может содержать sourceLink, scientificSource, communitySource
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!effect) {
      return null;
    }

    // Получаем количество комментариев
    const { getCommentsCountsBatch } = await import('@/app/actions/comments');
    const commentsCounts = await getCommentsCountsBatch([id]);
    const counts = commentsCounts[id] || { total: 0, withMedia: 0 };

    // Сериализуем эффект (извлекает дополнительные поля из interpretations)
    const serialized = serializeEffect(effect);
    return {
      ...serialized,
      commentsCount: counts.total,
      commentsWithMediaCount: counts.withMedia,
    };
  } catch (error) {
    console.error('Ошибка при получении эффекта:', error);
    throw new Error('Не удалось загрузить эффект');
  }
}

/**
 * Получить список категорий
 */
export async function getCategories(): Promise<string[]> {
  try {
    const categories = await prisma.effect.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return categories.map((c) => c.category);
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    throw new Error('Не удалось загрузить категории');
  }
}

/**
 * Увеличить счётчик просмотров
 */
export async function incrementViews(id: string): Promise<void> {
  try {
    console.log('[incrementViews] Увеличиваем просмотры для:', id); // <-- ЛОГ
    await prisma.effect.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
    console.log('[incrementViews] Успешно!'); // <-- ЛОГ
  } catch (error) {
    console.error('[incrementViews] Ошибка при обновлении просмотров:', error);
    // Не бросаем ошибку, чтобы не ломать UX
  }
}

/**
 * Получить статистику
 */
export async function getStats(): Promise<{
  totalEffects: number;
  totalVotes: number;
  totalViews: number;
  totalParticipants: number;
}> {
  console.log('[getStats] Запрос статистики из базы данных...');
  
  try {
    // Статистика эффектов
    const stats = await prisma.effect.aggregate({
      _count: { id: true },
      _sum: { views: true },
    });

    // Количество уникальных участников (уникальные visitorId из таблицы Vote)
    const uniqueParticipants = await prisma.vote.groupBy({
      by: ['visitorId'],
      _count: { visitorId: true },
    });

    // Количество голосов = количество записей в таблице Vote (каждый голос = одна запись)
    const totalVotesCount = await prisma.vote.count();

    const totalEffects = stats._count.id;
    const totalVotes = totalVotesCount; // Используем реальное количество голосов из БД
    const totalViews = stats._sum.views || 0;
    const totalParticipants = uniqueParticipants.length;

    console.log('[getStats] ✅ Статистика получена:', {
      totalEffects,
      totalVotes,
      totalViews,
      totalParticipants,
    });

    return {
      totalEffects,
      totalVotes,
      totalViews,
      totalParticipants,
    };
  } catch (error) {
    console.error('[getStats] ❌ ОШИБКА при получении статистики:', error);
    throw new Error('Не удалось загрузить статистику');
  }
}

/**
 * Получить случайные эффекты для квиза (исключая пройденные)
 */
export async function getQuizEffects(limit: number = 10, visitorId?: string): Promise<EffectResult[]> {
  try {
    console.log('[getQuizEffects] Запрос случайных эффектов, limit:', limit, 'visitorId:', visitorId?.substring(0, 20) + '...');

    // 1. Получаем все ID эффектов
    const allIds = await prisma.effect.findMany({
      select: { id: true },
    });

    if (allIds.length === 0) {
      console.log('[getQuizEffects] Нет эффектов в базе');
      return [];
    }

    // 2. Если есть visitorId, исключаем эффекты, на которые уже есть голоса
    // Также исключаем скрытые эффекты
    let availableIds = allIds.map((e) => e.id);
    
    // Фильтруем только видимые эффекты
    const visibleEffects = await prisma.effect.findMany({
      where: { isVisible: true },
      select: { id: true },
    });
    availableIds = visibleEffects.map((e) => e.id);
    
    if (visitorId && visitorId.length >= 10) {
      try {
        const userVotes = await prisma.vote.findMany({
          where: { visitorId },
          select: { effectId: true },
        });
        
        const votedEffectIds = new Set(userVotes.map((v) => v.effectId));
        availableIds = availableIds.filter((id) => !votedEffectIds.has(id));
        console.log('[getQuizEffects] Исключено пройденных эффектов:', votedEffectIds.size, 'Доступно:', availableIds.length);
      } catch (error) {
        console.error('[getQuizEffects] Ошибка при получении голосов пользователя:', error);
        // Продолжаем без исключения, если ошибка
      }
    }

    if (availableIds.length === 0) {
      console.log('[getQuizEffects] Нет доступных эффектов (все пройдены)');
      return [];
    }

    // 3. Перемешиваем массив ID (Fisher-Yates shuffle)
    const shuffledIds = [...availableIds];
    for (let i = shuffledIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
    }

    // 4. Берём первые `limit` штук
    const selectedIds = shuffledIds.slice(0, Math.min(limit, shuffledIds.length));

    // 5. Загружаем полные данные для выбранных ID
    const effects = await prisma.effect.findMany({
      where: { id: { in: selectedIds } },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        category: true,
        imageUrl: true,
        videoUrl: true,
        votesFor: true,
        votesAgainst: true,
        views: true,
        residue: true,
        residueSource: true,
        history: true,
        historySource: true,
        yearDiscovered: true,
        similarEffectIds: true,
        currentState: true, // <-- Добавлено
        interpretations: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 6. Сортируем в том же порядке, что и selectedIds (чтобы сохранить случайный порядок)
    const effectsMap = new Map(effects.map((e) => [e.id, e]));
    const orderedEffects = selectedIds
      .map((id) => effectsMap.get(id))
      .filter((e): e is PrismaEffect => e !== undefined)
      .map(serializeEffect);

    console.log('[getQuizEffects] ✅ Получено эффектов:', orderedEffects.length);

    return orderedEffects;
  } catch (error) {
    console.error('[getQuizEffects] ❌ ОШИБКА:', error);
    console.error('[getQuizEffects] Тип ошибки:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[getQuizEffects] Сообщение:', error instanceof Error ? error.message : String(error));
    
    // Возвращаем пустой массив вместо выброса ошибки для graceful degradation
    console.warn('[getQuizEffects] ⚠️ Возвращаем пустой массив из-за ошибки');
    return [];
  }
}

/**
 * Редирект на случайный эффект
 */
export async function redirectToRandomEffect(): Promise<never> {
  // Получаем все ID эффектов
  const allIds = await prisma.effect.findMany({
    select: { id: true },
  });

  if (allIds.length === 0) {
    // Если нет эффектов, редиректим на каталог
    redirect('/catalog');
  }

  // Выбираем случайный ID
  const randomIndex = Math.floor(Math.random() * allIds.length);
  const randomId = allIds[randomIndex].id;

  // Редирект на страницу эффекта
  redirect(`/effect/${randomId}`);
}

/**
 * Получить эффекты по массиву ID
 * Используется для генерации "Паспорта Реальности" на клиенте
 */
export async function getEffectsByIds(ids: string[]): Promise<{ success: boolean; data?: Array<{ id: string; title: string; category: string; votesFor: number; votesAgainst: number }>; error?: string }> {
  try {
    if (!ids || ids.length === 0) {
      return { success: true, data: [] };
    }

    const effects = await prisma.effect.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        title: true,
        category: true,
        votesFor: true,      // <--- Добавлено
        votesAgainst: true,  // <--- Добавлено
        // Нам не нужен весь контент, только метаданные для AI
      },
    });

    return { success: true, data: effects };
  } catch (error) {
    console.error('Error fetching effects by ids:', error);
    return { success: false, error: 'Failed to fetch effects' };
  }
}

/**
 * Получить список всех ID активных эффектов, отсортированных по дате создания
 * Используется для навигации "Следующий/Случайный непройденный"
 */
export async function getAllEffectIds(): Promise<{ success: boolean; data?: Array<{ id: string }>; error?: string }> {
  try {
    const effects = await prisma.effect.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    return { success: true, data: effects };
  } catch (error) {
    console.error('Error fetching all effect ids:', error);
    return { success: false, error: 'Failed to fetch effect ids' };
  }
}

/**
 * Получить похожие эффекты из той же категории
 * Используется для блока "Похожие эффекты" на странице эффекта
 */
export async function getRelatedEffects(category: string, currentId: string): Promise<{ success: boolean; data?: Array<{ id: string; title: string; imageUrl: string | null; category: string }>; error?: string }> {
  try {
    const effects = await prisma.effect.findMany({
      where: {
        category,
        id: { not: currentId },
        isVisible: true,
      },
      take: 4,
      orderBy: { createdAt: 'desc' }, // Или views: 'desc'
      select: {
        id: true,
        title: true,
        imageUrl: true,
        category: true,
      }
    });

    return { success: true, data: effects };
  } catch (error) {
    console.error('Error fetching related effects:', error);
    return { success: false, error: 'Failed to fetch related' };
  }
}

/**
 * Получить данные для каталога (эффекты и категории)
 * Используется в app/catalog/page.tsx
 */
export async function getCatalogData() {
  try {
    const [effects, categories] = await Promise.all([
      prisma.effect.findMany({
        where: { isVisible: true },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          imageUrl: true,
          votesFor: true,
          votesAgainst: true,
          createdAt: true,
          residue: true,
          history: true,
          views: true, // <-- ДОБАВЛЕНО
        },
      }),
      prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    // Получаем количество комментариев для всех эффектов
    const effectIds = effects.map(e => e.id);
    const { getCommentsCountsBatch } = await import('@/app/actions/comments');
    const commentsCounts = await getCommentsCountsBatch(effectIds);

    // Сериализация дат для передачи на клиент
    const serializedEffects = effects.map(effect => {
      const counts = commentsCounts[effect.id] || { total: 0, withMedia: 0 };
      return {
        ...effect,
        createdAt: effect.createdAt.toISOString(),
        commentsCount: counts.total,
        commentsWithMediaCount: counts.withMedia,
      };
    });

    return { 
      success: true, 
      data: { 
        effects: serializedEffects, 
        categories 
      } 
    };
  } catch (error) {
    console.error('Error fetching catalog data:', error);
    return { success: false, error: 'Failed to fetch catalog data' };
  }
}

function getDeterministicIndex(length: number): number {
  const now = new Date();
  const seed = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % length;
}

/**
 * Получить следующий не проголосованный эффект
 * Используется для навигации между эффектами, за которые пользователь еще не проголосовал
 */
export async function getNextUnvotedEffect(currentEffectId: string, votedEffectIds: string[]) {
  try {
    // Получаем все видимые эффекты, отсортированные по дате создания
    const allEffects = await prisma.effect.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
      },
    });

    // Находим текущий эффект в списке
    const currentIndex = allEffects.findIndex(e => e.id === currentEffectId);
    
    // Если текущий эффект не найден, возвращаем первый не проголосованный
    if (currentIndex === -1) {
      const firstUnvoted = allEffects.find(e => !votedEffectIds.includes(e.id));
      return { success: true, data: firstUnvoted || null };
    }

    // Ищем следующий не проголосованный эффект после текущего
    for (let i = currentIndex + 1; i < allEffects.length; i++) {
      if (!votedEffectIds.includes(allEffects[i].id)) {
        return { success: true, data: allEffects[i] };
      }
    }

    // Если не нашли после текущего, ищем с начала списка
    for (let i = 0; i < currentIndex; i++) {
      if (!votedEffectIds.includes(allEffects[i].id)) {
        return { success: true, data: allEffects[i] };
      }
    }

    // Если все эффекты проголосованы, возвращаем null
    return { success: true, data: null };
  } catch (error) {
    console.error('Error fetching next unvoted effect:', error);
    return { success: false, error: 'Failed to fetch next unvoted effect' };
  }
}

/**
 * Получить предыдущий не проголосованный эффект
 */
export async function getPrevUnvotedEffect(currentEffectId: string, votedEffectIds: string[]) {
  try {
    // Получаем все видимые эффекты, отсортированные по дате создания
    const allEffects = await prisma.effect.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
      },
    });

    // Находим текущий эффект в списке
    const currentIndex = allEffects.findIndex(e => e.id === currentEffectId);
    
    // Если текущий эффект не найден, возвращаем последний не проголосованный
    if (currentIndex === -1) {
      const lastUnvoted = [...allEffects].reverse().find(e => !votedEffectIds.includes(e.id));
      return { success: true, data: lastUnvoted || null };
    }

    // Ищем предыдущий не проголосованный эффект до текущего
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!votedEffectIds.includes(allEffects[i].id)) {
        return { success: true, data: allEffects[i] };
      }
    }

    // Если не нашли до текущего, ищем с конца списка
    for (let i = allEffects.length - 1; i > currentIndex; i--) {
      if (!votedEffectIds.includes(allEffects[i].id)) {
        return { success: true, data: allEffects[i] };
      }
    }

    // Если все эффекты проголосованы, возвращаем null
    return { success: true, data: null };
  } catch (error) {
    console.error('Error fetching prev unvoted effect:', error);
    return { success: false, error: 'Failed to fetch prev unvoted effect' };
  }
}

/**
 * Получить данные для главной страницы (тренды, новые эффекты, категории, статистика)
 * Используется в app/page.tsx
 */
export async function getHomeData() {
  try {
    const [effects, categories, totalVotesDb, uniqueVisitors] = await Promise.all([
      // 1. Получаем все эффекты (чтобы отсортировать их по популярности в JS)
      prisma.effect.findMany({
        where: { isVisible: true },
        select: {
          id: true, title: true, description: true, category: true,
          imageUrl: true, votesFor: true, votesAgainst: true, createdAt: true,
          views: true, // <-- ДОБАВЛЕНО
        }
      }),
      // 2. Категории
      prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
      // 3. Точная статистика
      prisma.vote.count(), // Всего голосов
      prisma.vote.groupBy({ by: ['visitorId'] }).then(res => res.length) // Участников
    ]);

    // Эффект дня: определяем детерминированно по текущей дате
    let effectOfDay: (typeof effects)[number] | null = null;
    if (effects.length > 0) {
      const sortedForSeed = [...effects].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      effectOfDay = sortedForSeed[getDeterministicIndex(sortedForSeed.length)];
    }

    // Получаем количество комментариев для всех эффектов
    const effectIds = effects.map(e => e.id);
    const { getCommentsCountsBatch } = await import('@/app/actions/comments');
    const commentsCounts = await getCommentsCountsBatch(effectIds);

    // Получаем количество комментариев для эффекта дня (если он есть)
    const effectOfDayCounts = effectOfDay ? (commentsCounts[effectOfDay.id] || { total: 0, withMedia: 0 }) : null;

    const effectOfDaySerialized = effectOfDay
      ? (() => {
          const totalVotes = effectOfDay!.votesFor + effectOfDay!.votesAgainst;
          const mandelaPercent = totalVotes > 0 ? Math.round((effectOfDay!.votesFor / totalVotes) * 100) : 50;
          const realityPercent = 100 - mandelaPercent;
          const nextReset = new Date();
          nextReset.setHours(24, 0, 0, 0);
          return {
            ...effectOfDay!,
            createdAt: effectOfDay!.createdAt.toISOString(),
            mandelaPercent,
            realityPercent,
            totalVotes,
            nextReset: nextReset.toISOString(),
            commentsCount: effectOfDayCounts?.total || 0,
            commentsWithMediaCount: effectOfDayCounts?.withMedia || 0,
          };
        })()
      : null;

    // Сортировка для Трендов (сумма голосов), исключаем эффект дня
    const trending = [...effects]
      .filter((effect) => !effectOfDay || effect.id !== effectOfDay.id)
      .sort((a, b) => (b.votesFor + b.votesAgainst) - (a.votesFor + a.votesAgainst))
      .slice(0, 3)
      .map(e => {
        const counts = commentsCounts[e.id] || { total: 0, withMedia: 0 };
        return { 
          ...e, 
          createdAt: e.createdAt.toISOString(),
          commentsCount: counts.total,
          commentsWithMediaCount: counts.withMedia,
        };
      });

    // Сортировка для Новых (дата)
    const newEffects = [...effects]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6)
      .map(e => {
        const counts = commentsCounts[e.id] || { total: 0, withMedia: 0 };
        return { 
          ...e, 
          createdAt: e.createdAt.toISOString(),
          commentsCount: counts.total,
          commentsWithMediaCount: counts.withMedia,
        };
      });

    // Статистика
    const stats = {
      totalEffects: effects.length,
      totalVotes: totalVotesDb,
      totalParticipants: uniqueVisitors
    };

    return {
      success: true,
      data: {
        trending,
        newEffects,
        categories,
        stats,
        effectOfDay: effectOfDaySerialized,
      }
    };
  } catch (error) {
    console.error('Error fetching home data:', error);
    return { success: false, error: 'Failed' };
  }
}

