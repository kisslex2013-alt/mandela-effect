'use client';

const STORAGE_KEY = 'mandela_votes';

export const votesStore = {
  get: (): Record<string, 'A' | 'B'> => {
    if (typeof window === 'undefined') return {};
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  },

  set: (effectId: string, variant: 'A' | 'B') => {
    if (typeof window === 'undefined') return;
    const votes = votesStore.get();
    votes[effectId] = variant;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
    
    // Генерируем событие для обновления UI в других компонентах
    window.dispatchEvent(new Event('votes-updated'));
  },

  has: (effectId: string): boolean => {
    const votes = votesStore.get();
    return !!votes[effectId];
  },

  // Добавлен метод очистки
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    // Генерируем событие, чтобы UI обновился (сбросил галочки)
    window.dispatchEvent(new Event('votes-updated'));
  }
};
