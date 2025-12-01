'use client';

const STORAGE_KEY = 'mandela_votes';

export type VoteMap = Record<string, 'A' | 'B'>;

export const votesStore = {
  get: (): VoteMap => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error reading votes:', e);
      return {};
    }
  },

  set: (effectId: string, variant: 'A' | 'B') => {
    if (typeof window === 'undefined') return;
    const votes = votesStore.get();
    votes[effectId] = variant;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
    // Оповещаем все компоненты
    window.dispatchEvent(new Event('votes-updated'));
  },

  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    // Оповещаем все компоненты
    window.dispatchEvent(new Event('votes-updated'));
  }
};

