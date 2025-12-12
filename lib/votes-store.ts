'use client';

const STORAGE_KEY = 'mandela_votes';

// Кэш в памяти
let memoryCache: Record<string, 'A' | 'B'> | null = null;
let isInitialized = false;

const initCache = () => {
  if (typeof window === 'undefined') return;
  if (isInitialized && memoryCache) return;

  try {
    const item = localStorage.getItem(STORAGE_KEY);
    memoryCache = item ? JSON.parse(item) : {};
  } catch (e) {
    console.error('Failed to parse votes from LS', e);
    memoryCache = {};
  }
  isInitialized = true;
};

export const votesStore = {
  get: (): Record<string, 'A' | 'B'> => {
    if (typeof window === 'undefined') return {};
    if (!isInitialized) initCache();
    return memoryCache || {};
  },

  getVote: (effectId: string): 'A' | 'B' | undefined => {
    if (typeof window === 'undefined') return undefined;
    if (!isInitialized) initCache();
    return memoryCache?.[effectId];
  },

  set: (effectId: string, variant: 'A' | 'B') => {
    if (typeof window === 'undefined') return;
    if (!isInitialized) initCache();

    // #region agent log
    const startTime = performance.now();
    const callId = Math.random().toString(36).substring(7);
    fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'votes-store.ts:48',message:'votesStore.set START',data:{effectId,variant,callId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion

    // 1. Обновляем память (Мгновенно)
    if (memoryCache) {
      if (memoryCache[effectId] === variant) {
        // #region agent log
        const duration = performance.now() - startTime;
        fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'votes-store.ts:54',message:'votesStore.set SKIP (no change)',data:{duration,callId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
        // #endregion
        return;
      }
      memoryCache[effectId] = variant;
    }
    
    // 2. Генерируем событие для обновления UI (Мгновенно)
    // Передаем копию кэша, чтобы избежать мутаций
    window.dispatchEvent(new CustomEvent('votes-updated', { detail: { ...memoryCache } }));

    // #region agent log
    const localStorageStart = performance.now();
    // #endregion

    // 3. Сохраняем в localStorage (Асинхронно / Отложенно)
    // Используем requestIdleCallback или setTimeout, чтобы не блокировать клик
    const saveToStorage = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
        // #region agent log
        const localStorageEnd = performance.now();
        const duration = localStorageEnd - startTime;
        if (duration > 10) {
          fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'votes-store.ts:75',message:'votesStore.set SLOW',data:{duration,localStorageDuration:localStorageEnd-localStorageStart,callId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
        }
        fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'votes-store.ts:78',message:'votesStore.set COMPLETE',data:{duration,callId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
        // #endregion
      } catch (e) {
        console.error('Failed to save votes to LS', e);
      }
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(saveToStorage);
    } else {
      setTimeout(saveToStorage, 0);
    }
  },

  has: (effectId: string): boolean => {
    if (!isInitialized) initCache();
    return !!memoryCache?.[effectId];
  },

  clear: () => {
    if (typeof window === 'undefined') return;
    memoryCache = {};
    localStorage.removeItem(STORAGE_KEY);
    isInitialized = false;
    window.dispatchEvent(new Event('votes-updated'));
  },
  
  sync: () => {
    isInitialized = false;
    initCache();
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      votesStore.sync();
      window.dispatchEvent(new Event('votes-updated'));
    }
  });
}
