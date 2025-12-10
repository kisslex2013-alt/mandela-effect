/**
 * Утилиты для работы с анонимным ID посетителя (visitorId)
 * 
 * VisitorId генерируется при первом посещении и сохраняется в localStorage.
 * Это позволяет отслеживать голоса пользователя без регистрации.
 */

const VISITOR_ID_KEY = 'mandela_visitor_id';
const VISITOR_ID_VERSION = 'v1'; // Для миграций в будущем

/**
 * Генерирует уникальный ID посетителя
 */
function generateVisitorId(): string {
  // Используем crypto.randomUUID если доступен
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${VISITOR_ID_VERSION}_${crypto.randomUUID()}`;
  }
  
  // Fallback для старых браузеров
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${VISITOR_ID_VERSION}_${timestamp}_${randomPart}${randomPart2}`;
}

/**
 * Получает или создаёт visitorId
 * Возвращает null если localStorage недоступен (SSR)
 */
export function getVisitorId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);

    if (!visitorId) {
      visitorId = generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
      console.log('[Visitor] Создан новый visitorId:', visitorId.substring(0, 20) + '...');
    }

    return visitorId;
  } catch (error) {
    console.error('[Visitor] Ошибка доступа к localStorage:', error);
    return null;
  }
}

/**
 * Проверяет, есть ли сохранённый visitorId
 */
export function hasVisitorId(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return !!localStorage.getItem(VISITOR_ID_KEY);
  } catch {
    return false;
  }
}

/**
 * Получает локальные голоса из старого формата localStorage
 * Используется для миграции на серверное хранение
 */
export function getLocalVotes(): Array<{ effectId: string; variant: 'A' | 'B'; timestamp?: number }> {
  if (typeof window === 'undefined') {
    return [];
  }

  const votes: Array<{ effectId: string; variant: 'A' | 'B'; timestamp?: number }> = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('voted_effect_')) {
        const effectId = key.replace('voted_effect_', '');
        const voteDataStr = localStorage.getItem(key);

        if (!voteDataStr || !effectId) continue;

        try {
          const voteData = JSON.parse(voteDataStr);
          if (voteData.variant && (voteData.variant === 'A' || voteData.variant === 'B')) {
            votes.push({
              effectId,
              variant: voteData.variant,
              timestamp: voteData.timestamp,
            });
          }
        } catch {
          // Старый формат (просто 'A' или 'B')
          if (voteDataStr === 'A' || voteDataStr === 'B') {
            votes.push({ effectId, variant: voteDataStr });
          }
        }
      }
    }
  } catch (error) {
    console.error('[Visitor] Ошибка чтения локальных голосов:', error);
  }

  return votes;
}

/**
 * Очищает локальные голоса после успешной миграции
 */
export function clearLocalVotes(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('voted_effect_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log(`[Visitor] Очищено ${keysToRemove.length} локальных голосов`);
  } catch (error) {
    console.error('[Visitor] Ошибка очистки локальных голосов:', error);
  }
}

/**
 * Проверяет, нужна ли миграция (есть локальные голоса)
 */
export function needsMigration(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('voted_effect_')) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Сохраняет голос локально (для оффлайн-режима или как бэкап)
 */
export function saveLocalVote(effectId: string, variant: 'A' | 'B', effectTitle?: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = `voted_effect_${effectId}`;
    const data = {
      variant,
      timestamp: Date.now(),
      effectTitle: effectTitle || '',
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('[Visitor] Ошибка сохранения локального голоса:', error);
  }
}

/**
 * Получает локальный голос по ID эффекта
 */
export function getLocalVote(effectId: string): 'A' | 'B' | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const key = `voted_effect_${effectId}`;
    const voteDataStr = localStorage.getItem(key);

    if (!voteDataStr) return null;

    try {
      const voteData = JSON.parse(voteDataStr);
      if (voteData.variant === 'A' || voteData.variant === 'B') {
        return voteData.variant;
      }
    } catch {
      // Старый формат
      if (voteDataStr === 'A' || voteDataStr === 'B') {
        return voteDataStr;
      }
    }
  } catch {
    return null;
  }

  return null;
}

