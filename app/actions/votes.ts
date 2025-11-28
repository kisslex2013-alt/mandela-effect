'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Интерфейс для голоса
export interface VoteData {
  visitorId: string;
  effectId: string;
  variant: 'A' | 'B';
}

// Интерфейс для результата голосования
export interface VoteResult {
  success: boolean;
  vote?: {
    id: string;
    visitorId: string;
    effectId: string;
    variant: string;
  };
  effect?: {
    votesFor: number;
    votesAgainst: number;
    percentA: number;
    percentB: number;
    totalVotes: number;
  };
  error?: string;
  isNewVote?: boolean; // true если новый голос, false если обновление
}

// Интерфейс для статистики пользователя
export interface UserVoteStats {
  totalVotes: number;
  votes: Array<{
    effectId: string;
    variant: string;
    createdAt: string;
  }>;
}

/**
 * Сохранить или обновить голос пользователя
 */
export async function saveVote(data: VoteData): Promise<VoteResult> {
  try {
    const { visitorId, effectId, variant } = data;

    console.log('[saveVote] Начало сохранения голоса:', {
      visitorId: visitorId?.substring(0, 20) + '...',
      effectId,
      variant,
    });

    // Валидация
    if (!visitorId || visitorId.length < 10) {
      console.error('[saveVote] ❌ Некорректный visitorId:', visitorId?.substring(0, 20));
      return { success: false, error: 'Некорректный ID посетителя' };
    }

    if (!effectId) {
      console.error('[saveVote] ❌ Отсутствует effectId');
      return { success: false, error: 'ID эффекта обязателен' };
    }

    if (variant !== 'A' && variant !== 'B') {
      console.error('[saveVote] ❌ Некорректный variant:', variant);
      return { success: false, error: 'Вариант должен быть A или B' };
    }

    // Проверяем существование эффекта
    const effect = await prisma.effect.findUnique({
      where: { id: effectId },
    });

    if (!effect) {
      console.error('[saveVote] ❌ Эффект не найден:', effectId);
      return { success: false, error: 'Эффект не найден' };
    }

    console.log('[saveVote] ✅ Эффект найден:', effect.title);

    // Проверяем, есть ли уже голос
    const existingVote = await prisma.vote.findUnique({
      where: {
        visitorId_effectId: { visitorId, effectId },
      },
    });

    let vote;
    let isNewVote = false;

    if (existingVote) {
      // Если голос тот же — ничего не делаем
      if (existingVote.variant === variant) {
        const totalVotes = effect.votesFor + effect.votesAgainst;
        return {
          success: true,
          vote: {
            id: existingVote.id,
            visitorId: existingVote.visitorId,
            effectId: existingVote.effectId,
            variant: existingVote.variant,
          },
          effect: {
            votesFor: effect.votesFor,
            votesAgainst: effect.votesAgainst,
            percentA: totalVotes > 0 ? (effect.votesFor / totalVotes) * 100 : 50,
            percentB: totalVotes > 0 ? (effect.votesAgainst / totalVotes) * 100 : 50,
            totalVotes,
          },
          isNewVote: false,
        };
      }

      // Обновляем голос и пересчитываем статистику
      const oldVariant = existingVote.variant;

      console.log('[saveVote] Обновление существующего голоса:', {
        oldVariant,
        newVariant: variant,
        effectId,
      });

      vote = await prisma.vote.update({
        where: { id: existingVote.id },
        data: { variant },
      });
      console.log('[saveVote] ✅ Голос обновлен:', vote.id);

      // Пересчитываем: убираем старый голос, добавляем новый
      // Если старый голос был A, а новый B: votesFor -1, votesAgainst +1
      // Если старый голос был B, а новый A: votesFor +1, votesAgainst -1
      const votesForIncrement = oldVariant === 'A' ? -1 : (variant === 'A' ? 1 : 0);
      const votesAgainstIncrement = oldVariant === 'B' ? -1 : (variant === 'B' ? 1 : 0);

      await prisma.effect.update({
        where: { id: effectId },
        data: {
          votesFor: { increment: votesForIncrement },
          votesAgainst: { increment: votesAgainstIncrement },
        },
      });
      console.log('[saveVote] ✅ Статистика эффекта обновлена:', {
        votesForIncrement,
        votesAgainstIncrement,
      });
    } else {
      // Создаём новый голос
      console.log('[saveVote] Создание нового голоса...');
      vote = await prisma.vote.create({
        data: { visitorId, effectId, variant },
      });
      console.log('[saveVote] ✅ Голос создан:', vote.id);

      // Обновляем статистику эффекта
      await prisma.effect.update({
        where: { id: effectId },
        data: {
          votesFor: variant === 'A' ? { increment: 1 } : undefined,
          votesAgainst: variant === 'B' ? { increment: 1 } : undefined,
        },
      });
      console.log('[saveVote] ✅ Статистика эффекта обновлена');

      isNewVote = true;
    }

    // Получаем обновлённую статистику
    const updatedEffect = await prisma.effect.findUnique({
      where: { id: effectId },
      select: { votesFor: true, votesAgainst: true },
    });

    const totalVotes = (updatedEffect?.votesFor || 0) + (updatedEffect?.votesAgainst || 0);

    // Ревалидируем кэш
    revalidatePath(`/effect/${effectId}`);
    revalidatePath('/');
    revalidatePath('/catalog');

    return {
      success: true,
      vote: {
        id: vote.id,
        visitorId: vote.visitorId,
        effectId: vote.effectId,
        variant: vote.variant,
      },
      effect: {
        votesFor: updatedEffect?.votesFor || 0,
        votesAgainst: updatedEffect?.votesAgainst || 0,
        percentA: totalVotes > 0 ? ((updatedEffect?.votesFor || 0) / totalVotes) * 100 : 50,
        percentB: totalVotes > 0 ? ((updatedEffect?.votesAgainst || 0) / totalVotes) * 100 : 50,
        totalVotes,
      },
      isNewVote,
    };
  } catch (error) {
    console.error('[saveVote] Ошибка:', error);
    return { success: false, error: 'Не удалось сохранить голос' };
  }
}

/**
 * Получить голос пользователя по эффекту
 */
export async function getUserVote(
  visitorId: string,
  effectId: string
): Promise<{ variant: string | null }> {
  try {
    if (!visitorId || !effectId) {
      return { variant: null };
    }

    const vote = await prisma.vote.findUnique({
      where: {
        visitorId_effectId: { visitorId, effectId },
      },
      select: { variant: true },
    });

    return { variant: vote?.variant || null };
  } catch (error) {
    console.error('[getUserVote] Ошибка:', error);
    return { variant: null };
  }
}

/**
 * Получить все голоса пользователя
 */
export async function getUserVotes(visitorId: string): Promise<UserVoteStats> {
  try {
    if (!visitorId) {
      return { totalVotes: 0, votes: [] };
    }

    const votes = await prisma.vote.findMany({
      where: { visitorId },
      orderBy: { createdAt: 'desc' },
      select: {
        effectId: true,
        variant: true,
        createdAt: true,
      },
    });

    return {
      totalVotes: votes.length,
      votes: votes.map((v) => ({
        effectId: v.effectId,
        variant: v.variant,
        createdAt: v.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('[getUserVotes] Ошибка:', error);
    return { totalVotes: 0, votes: [] };
  }
}

/**
 * Получить статистику пользователя с деталями
 */
export async function getUserStats(visitorId: string): Promise<{
  totalVotes: number;
  inMajority: number;
  inMinority: number;
  uniqueMemory: number;
  votedEffectIds: string[];
}> {
  try {
    if (!visitorId) {
      return { totalVotes: 0, inMajority: 0, inMinority: 0, uniqueMemory: 0, votedEffectIds: [] };
    }

    // Получаем все голоса пользователя с данными эффектов
    const votes = await prisma.vote.findMany({
      where: { visitorId },
      select: {
        effectId: true,
        variant: true,
      },
    });

    if (votes.length === 0) {
      return { totalVotes: 0, inMajority: 0, inMinority: 0, uniqueMemory: 0, votedEffectIds: [] };
    }

    // Получаем статистику эффектов
    const effectIds = votes.map((v) => v.effectId);
    const effects = await prisma.effect.findMany({
      where: { id: { in: effectIds } },
      select: { id: true, votesFor: true, votesAgainst: true },
    });

    const effectsMap = new Map(effects.map((e) => [e.id, e]));

    let inMajority = 0;
    let inMinority = 0;
    let uniqueMemory = 0;

    for (const vote of votes) {
      const effect = effectsMap.get(vote.effectId);
      if (!effect) continue;

      const totalVotes = effect.votesFor + effect.votesAgainst;
      if (totalVotes === 0) continue;

      const percentA = (effect.votesFor / totalVotes) * 100;
      const percentB = (effect.votesAgainst / totalVotes) * 100;
      const userPercent = vote.variant === 'A' ? percentA : percentB;

      if (userPercent > 50) {
        inMajority++;
      } else if (userPercent >= 30) {
        inMinority++;
      } else {
        uniqueMemory++;
      }
    }

    return {
      totalVotes: votes.length,
      inMajority,
      inMinority,
      uniqueMemory,
      votedEffectIds: effectIds,
    };
  } catch (error) {
    console.error('[getUserStats] Ошибка:', error);
    return { totalVotes: 0, inMajority: 0, inMinority: 0, uniqueMemory: 0, votedEffectIds: [] };
  }
}

/**
 * Миграция голосов с localStorage на сервер
 * Вызывается при первом входе пользователя с существующими локальными голосами
 */
export async function migrateLocalVotes(
  visitorId: string,
  localVotes: Array<{ effectId: string; variant: 'A' | 'B' }>
): Promise<{ success: boolean; migrated: number; errors: number }> {
  try {
    if (!visitorId || !localVotes.length) {
      return { success: true, migrated: 0, errors: 0 };
    }

    let migrated = 0;
    let errors = 0;

    for (const localVote of localVotes) {
      try {
        // Проверяем, нет ли уже голоса на сервере
        const existingVote = await prisma.vote.findUnique({
          where: {
            visitorId_effectId: { visitorId, effectId: localVote.effectId },
          },
        });

        if (!existingVote) {
          // Проверяем существование эффекта
          const effect = await prisma.effect.findUnique({
            where: { id: localVote.effectId },
          });

          if (effect) {
            // Создаём голос
            await prisma.vote.create({
              data: {
                visitorId,
                effectId: localVote.effectId,
                variant: localVote.variant,
              },
            });

            // Обновляем статистику эффекта
            await prisma.effect.update({
              where: { id: localVote.effectId },
              data: {
                votesFor: localVote.variant === 'A' ? { increment: 1 } : undefined,
                votesAgainst: localVote.variant === 'B' ? { increment: 1 } : undefined,
              },
            });

            migrated++;
          }
        }
      } catch {
        errors++;
      }
    }

    console.log(`[migrateLocalVotes] Мигрировано: ${migrated}, ошибок: ${errors}`);

    return { success: true, migrated, errors };
  } catch (error) {
    console.error('[migrateLocalVotes] Ошибка:', error);
    return { success: false, migrated: 0, errors: localVotes.length };
  }
}

