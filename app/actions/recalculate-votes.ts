'use server';

import prisma from '@/lib/prisma';

/**
 * Пересчитать счетчики votesFor и votesAgainst для всех эффектов
 * на основе реальных данных из таблицы Vote
 */
export async function recalculateAllVoteCounters(): Promise<{
  success: boolean;
  updated: number;
  errors: number;
  message: string;
}> {
  try {
    console.log('[recalculateVotes] Начало пересчета счетчиков...');

    // Получаем все эффекты
    const allEffects = await prisma.effect.findMany({
      select: { id: true },
    });

    console.log(`[recalculateVotes] Найдено эффектов: ${allEffects.length}`);

    let updated = 0;
    let errors = 0;

    // Для каждого эффекта пересчитываем счетчики
    for (const effect of allEffects) {
      try {
        // Подсчитываем голоса из таблицы Vote
        const votesFor = await prisma.vote.count({
          where: {
            effectId: effect.id,
            variant: 'A',
          },
        });

        const votesAgainst = await prisma.vote.count({
          where: {
            effectId: effect.id,
            variant: 'B',
          },
        });

        // Обновляем счетчики в таблице Effect
        await prisma.effect.update({
          where: { id: effect.id },
          data: {
            votesFor,
            votesAgainst,
          },
        });

        updated++;
      } catch (error) {
        console.error(`[recalculateVotes] Ошибка для эффекта ${effect.id}:`, error);
        errors++;
      }
    }

    const message = `Пересчитано ${updated} эффектов, ошибок: ${errors}`;
    console.log(`[recalculateVotes] ✅ ${message}`);

    return {
      success: true,
      updated,
      errors,
      message,
    };
  } catch (error) {
    console.error('[recalculateVotes] ❌ Критическая ошибка:', error);
    return {
      success: false,
      updated: 0,
      errors: 0,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

