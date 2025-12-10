'use server'

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function cycleVotesForTesting(visitorId: string) {
  if (!visitorId) return { success: false, message: "No visitor ID" };

  // Проверка на случай, если prisma не инициализировалась
  if (!prisma) {
    console.error("Prisma client is undefined!");
    return { success: false, message: "Server Error: Prisma not initialized" };
  }

  try {
    // 1. Получаем текущее количество
    const currentCount = await prisma.vote.count({
      where: { visitorId }
    });

    // 2. Определяем следующую цель (Цикл: 0 -> 10 -> 20 -> 24 -> 0)
    let targetCount = 0;
    if (currentCount < 10) targetCount = 10;
    else if (currentCount < 20) targetCount = 20;
    else if (currentCount < 24) targetCount = 24;
    else targetCount = 0; // Сброс

    console.log(`DEV TOOLS: Cycling votes from ${currentCount} to ${targetCount}`);

    // 3. Применяем изменения
    if (targetCount > currentCount) {
      // ДОБАВЛЯЕМ ГОЛОСА
      const needed = targetCount - currentCount;
      
      // Получаем список эффектов, чтобы привязать голоса к реальным ID (для целостности БД)
      const effects = await prisma.effect.findMany({
        take: 50,
        select: { id: true }
      });

      if (effects.length === 0) {
        return { success: false, message: "No effects found in database" };
      }

      // Находим эффекты, за которые юзер УЖЕ голосовал, чтобы не дублировать
      const existingVotes = await prisma.vote.findMany({
        where: { visitorId },
        select: { effectId: true }
      });
      const votedIds = new Set(existingVotes.map(v => v.effectId));
      
      // Берем только те, за которые еще нет голоса
      const availableEffects = effects.filter(e => !votedIds.has(e.id));
      
      if (availableEffects.length === 0) {
        return { success: false, message: "No available effects to vote for" };
      }

      let created = 0;
      for (const effect of availableEffects) {
        if (created >= needed) break;
        
        try {
          await prisma.vote.create({
            data: {
              visitorId,
              effectId: effect.id,
              variant: 'A' // Используем 'A' вместо 'TEST_VOTE_A', так как в схеме variant: String
            }
          });
          created++;
        } catch (error: any) {
          // Игнорируем ошибки уникальности (если уже есть голос за этот эффект)
          if (error.code !== 'P2002') {
            console.error("Error creating vote:", error);
          }
        }
      }
    } else if (targetCount < currentCount) {
      // УДАЛЯЕМ ГОЛОСА (Сброс)
      const toDelete = currentCount - targetCount;
      
      // Находим последние голоса пользователя
      const votesToDelete = await prisma.vote.findMany({
        where: { visitorId },
        take: toDelete,
        orderBy: { createdAt: 'desc' },
        select: { id: true }
      });

      for (const vote of votesToDelete) {
        await prisma.vote.delete({
          where: { id: vote.id }
        });
      }
    }

    revalidatePath('/');
    return { success: true, count: targetCount, message: `Votes set to ${targetCount}` };
    
  } catch (error) {
    console.error("Dev tool error:", error);
    return { success: false, message: "Database error", error: String(error) };
  }
}
