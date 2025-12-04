/**
 * Утилита для отслеживания прочитанных комментариев
 * Использует localStorage для хранения информации о последнем просмотре комментариев
 */

const STORAGE_KEY = 'mandela_effect_read_comments';
const STORAGE_KEY_TIMESTAMPS = 'mandela_effect_comment_timestamps';

interface ReadCommentsData {
  [effectId: string]: {
    lastReadAt: string; // ISO timestamp последнего просмотра
    lastCommentCount: number; // Количество комментариев на момент последнего просмотра
  };
}

interface CommentTimestamps {
  [effectId: string]: {
    lastCommentTimestamp: string; // ISO timestamp последнего комментария
    commentCount: number; // Количество комментариев
  };
}

/**
 * Получить данные о прочитанных комментариях из localStorage
 */
export function getReadCommentsData(): ReadCommentsData {
  if (typeof window === 'undefined') return {};
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[getReadCommentsData] Ошибка:', error);
    return {};
  }
}

/**
 * Сохранить информацию о прочитанных комментариях
 */
export function markCommentsAsRead(effectId: string, commentCount: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data = getReadCommentsData();
    data[effectId] = {
      lastReadAt: new Date().toISOString(),
      lastCommentCount: commentCount,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[markCommentsAsRead] Ошибка:', error);
  }
}

/**
 * Проверить, есть ли новые комментарии для эффекта
 */
export function hasNewComments(
  effectId: string, 
  currentCommentCount: number,
  lastCommentTimestamp?: string
): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const data = getReadCommentsData();
    const readData = data[effectId];
    
    // Если пользователь никогда не просматривал комментарии этого эффекта
    if (!readData) {
      return currentCommentCount > 0;
    }
    
    // Если количество комментариев увеличилось
    if (currentCommentCount > readData.lastCommentCount) {
      return true;
    }
    
    // Если есть timestamp последнего комментария и он новее последнего просмотра
    if (lastCommentTimestamp) {
      const lastReadAt = new Date(readData.lastReadAt);
      const lastCommentAt = new Date(lastCommentTimestamp);
      return lastCommentAt > lastReadAt;
    }
    
    return false;
  } catch (error) {
    console.error('[hasNewComments] Ошибка:', error);
    return false;
  }
}

/**
 * Сохранить timestamp последнего комментария для эффекта
 */
export function updateCommentTimestamp(effectId: string, timestamp: string, count: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data = getCommentTimestamps();
    data[effectId] = {
      lastCommentTimestamp: timestamp,
      commentCount: count,
    };
    localStorage.setItem(STORAGE_KEY_TIMESTAMPS, JSON.stringify(data));
  } catch (error) {
    console.error('[updateCommentTimestamp] Ошибка:', error);
  }
}

/**
 * Получить timestamps комментариев
 */
export function getCommentTimestamps(): CommentTimestamps {
  if (typeof window === 'undefined') return {};
  
  try {
    const data = localStorage.getItem(STORAGE_KEY_TIMESTAMPS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[getCommentTimestamps] Ошибка:', error);
    return {};
  }
}

/**
 * Очистить данные о прочитанных комментариях (для тестирования)
 */
export function clearReadCommentsData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY_TIMESTAMPS);
  } catch (error) {
    console.error('[clearReadCommentsData] Ошибка:', error);
  }
}

