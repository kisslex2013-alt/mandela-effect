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
  createdAt: string;
  updatedAt: string;
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
  interpretations: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

// Вспомогательная функция для сериализации эффекта
function serializeEffect(effect: PrismaEffect): EffectResult {
  // Безопасная сериализация interpretations (может быть null или любым JSON значением)
  let safeInterpretations: Prisma.JsonValue = null;
  try {
    // Если interpretations не null, проверяем что это валидный JSON
    if (effect.interpretations !== null && effect.interpretations !== undefined) {
      // Если это уже сериализуемый объект, оставляем как есть
      safeInterpretations = effect.interpretations;
    }
  } catch (error) {
    console.warn('[serializeEffect] Ошибка при обработке interpretations:', error);
    safeInterpretations = null;
  }

  return {
    ...effect,
    interpretations: safeInterpretations,
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
  const where: Prisma.EffectWhereInput = {};

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
        interpretations: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`[getEffects] ✅ Получено эффектов: ${effects.length}`);

    // Сериализуем даты в строки для корректной передачи клиенту
    const serialized = effects.map(serializeEffect);
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
        interpretations: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return effect ? serializeEffect(effect) : null;
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
    await prisma.effect.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  } catch (error) {
    console.error('Ошибка при обновлении просмотров:', error);
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
    let availableIds = allIds.map((e) => e.id);
    
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

