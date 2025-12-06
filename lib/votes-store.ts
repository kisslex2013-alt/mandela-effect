'use client';

export const votesStore = {
  get: (): Record<string, 'A' | 'B'> => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('mandela_votes') || '{}');
    } catch {
      return {};
    }
  },
  set: (effectId: string, variant: 'A' | 'B') => {
    if (typeof window === 'undefined') return;
    const votes = votesStore.get();
    votes[effectId] = variant;
    localStorage.setItem('mandela_votes', JSON.stringify(votes));
    // Генерируем событие, чтобы другие компоненты могли обновиться
    window.dispatchEvent(new Event('votes-updated'));
  },
  has: (effectId: string): boolean => {
    const votes = votesStore.get();
    return !!votes[effectId];
  }
};
