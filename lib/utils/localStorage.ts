/**
 * Утилиты для оптимизированной работы с localStorage
 * Кэширует результаты для избежания повторных чтений
 */

let localStorageCache: Map<string, any> = new Map();
let cacheTimestamp = 0;
const CACHE_TTL = 1000; // 1 секунда

/**
 * Получить все голоса пользователя из localStorage
 * Использует кэширование для оптимизации
 */
export function getUserVotes(): Array<{ effectId: number; variant: 'A' | 'B' }> {
  if (typeof window === 'undefined') return [];

  // Проверяем кэш
  const now = Date.now();
  if (now - cacheTimestamp < CACHE_TTL && localStorageCache.has('votes')) {
    return localStorageCache.get('votes') as Array<{ effectId: number; variant: 'A' | 'B' }>;
  }

  const votes: Array<{ effectId: number; variant: 'A' | 'B' }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('voted_effect_')) {
      const effectId = parseInt(key.replace('voted_effect_', ''));
      if (isNaN(effectId)) continue;

      const voteDataStr = localStorage.getItem(key);
      if (!voteDataStr) continue;

      try {
        const voteData = JSON.parse(voteDataStr);
        if (voteData.variant && (voteData.variant === 'A' || voteData.variant === 'B')) {
          votes.push({ effectId, variant: voteData.variant });
        }
      } catch {
        // Пропускаем невалидные данные
        continue;
      }
    }
  }

  // Обновляем кэш
  localStorageCache.set('votes', votes);
  cacheTimestamp = now;

  return votes;
}

/**
 * Инвалидировать кэш (вызывать после изменения голосов)
 */
export function invalidateVotesCache(): void {
  localStorageCache.delete('votes');
  cacheTimestamp = 0;
}

