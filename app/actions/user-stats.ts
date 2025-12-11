'use server'

import prisma from "@/lib/prisma";

export async function getUserVoteCount(visitorId: string) {
  if (!visitorId) return 0;

  try {
    const count = await prisma.vote.count({
      where: {
        visitorId: visitorId
      }
    });

    return count;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return 0;
  }
}

// НОВАЯ ФУНКЦИЯ: Статистика по категориям для графика
export async function getUserCategoryStats(visitorId: string) {
  if (!visitorId) return [];

  try {
    // 1. Получаем все голоса пользователя
    const votes = await prisma.vote.findMany({
      where: { visitorId },
      select: {
        effectId: true,
        variant: true
      }
    });

    // 2. Получаем все уникальные effectId
    const effectIds = [...new Set(votes.map(v => v.effectId))];

    // 3. Получаем категории для всех эффектов
    const effects = await prisma.effect.findMany({
      where: {
        id: { in: effectIds }
      },
      select: {
        id: true,
        category: true
      }
    });

    // 4. Создаем мапу effectId -> category
    const effectCategoryMap = new Map(effects.map(e => [e.id, e.category]));

    // 5. Объединяем голоса с категориями
    const votesWithCategories = votes.map(vote => ({
      ...vote,
      category: effectCategoryMap.get(vote.effectId)
    }));

    // 2. Группируем и считаем проценты
    // Нам нужно свести все категории к 6 основным осям
    const groups = {
      'Медиа': ['films', 'cartoons', 'tv', 'popculture'],
      'Бренды': ['brands', 'tech', 'food'],
      'СССР / РФ': ['russian', 'childhood', 'soviet'],
      'Мир': ['geography', 'history', 'art'],
      'Игры': ['games', 'toys'],
      'Люди': ['people', 'music', 'quotes', 'literature']
    };

    const stats: Record<string, { total: number, mandela: number }> = {
      'Медиа': { total: 0, mandela: 0 },
      'Бренды': { total: 0, mandela: 0 },
      'СССР / РФ': { total: 0, mandela: 0 },
      'Мир': { total: 0, mandela: 0 },
      'Игры': { total: 0, mandela: 0 },
      'Люди': { total: 0, mandela: 0 }
    };

    votesWithCategories.forEach(vote => {
      const cat = vote.category;
      if (!cat) return;

      let groupName: string | null = null;
      
      // Ищем, к какой группе относится категория
      for (const [name, slugs] of Object.entries(groups)) {
        if (slugs.includes(cat)) {
          groupName = name;
          break;
        }
      }

      // Если категория не нашлась, пропускаем
      if (groupName && stats[groupName]) {
        stats[groupName].total += 1;
        if (vote.variant === 'A') {
          stats[groupName].mandela += 1;
        }
      }
    });

    // 3. Формируем массив для графика
    const chartData = Object.keys(stats).map(subject => {
      const data = stats[subject];
      // Если голосов нет, ставим 0, иначе считаем процент "Манделы"
      const percentage = data.total === 0 ? 0 : Math.round((data.mandela / data.total) * 100);
      
      // Если голосов совсем нет, ставим 20 для красоты, чтобы график не был пустой точкой
      const displayValue = data.total === 0 ? 20 : percentage;

      return {
        subject,
        A: displayValue,
        fullMark: 100
      };
    });

    return chartData;

  } catch (error) {
    console.error("Error fetching category stats:", error);
    // Возвращаем заглушку в случае ошибки
    return [
      { subject: 'Медиа', A: 50, fullMark: 100 },
      { subject: 'Бренды', A: 50, fullMark: 100 },
      { subject: 'СССР / РФ', A: 50, fullMark: 100 },
      { subject: 'Мир', A: 50, fullMark: 100 },
      { subject: 'Игры', A: 50, fullMark: 100 },
      { subject: 'Люди', A: 50, fullMark: 100 },
    ];
  }
}

