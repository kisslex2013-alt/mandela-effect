'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getUserVoteCount } from '@/app/actions/user-stats';
import { getClientVisitorId } from '@/lib/client-visitor'; // ИМПОРТ
import { getUserVotedEffects, migrateLocalVotes } from '@/app/actions/votes';
import { votesStore } from '@/lib/votes-store';

interface RealityContextType {
  isUpsideDown: boolean;
  toggleReality: () => void;
  isUnlocked: boolean;
  voteCount: number;
  requiredVotes: number;
  refreshVotes: () => Promise<void>;
  incrementVotes: () => void;
  isTransitioning: boolean; // Новое состояние
}

const RealityContext = createContext<RealityContextType | undefined>(undefined);

export function RealityProvider({ children }: { children: React.ReactNode }) {
  // Инициализация isUpsideDown с синхронным чтением sessionStorage для предотвращения hydration mismatch
  const [isUpsideDown, setIsUpsideDown] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = sessionStorage.getItem('reality-mode');
    return saved === 'upside-down';
  });
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false); // Новое состояние
  const [mounted, setMounted] = useState(false);
  const REQUIRED_VOTES = 25;
  
  // Защита от множественных одновременных вызовов
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = useCallback(async () => {
    // Предотвращаем множественные одновременные вызовы
    if (isSyncingRef.current) {
      return;
    }
    
    const vid = getClientVisitorId(); // ИСПОЛЬЗУЕМ ЕДИНУЮ ФУНКЦИЮ
    if (!vid) {
      setVoteCount(0);
      setIsUnlocked(false);
      return;
    }

    isSyncingRef.current = true;

    try {
      // Таймаут для предотвращения зависания
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sync timeout')), 15000)
      );
      
      // 1. Получаем голоса с сервера (источник правды)
      const serverVotesPromise = getUserVotedEffects(vid);
      let serverVotes = await Promise.race([serverVotesPromise, timeoutPromise]) as Awaited<ReturnType<typeof getUserVotedEffects>>;
      const serverVotesMap = new Map(
        serverVotes.map(v => [v.effectId, v.variant])
      );

      // 2. Получаем голоса из localStorage
      const localVotes = votesStore.get();
      const localVotesArray = Object.entries(localVotes).map(([effectId, variant]) => ({
        effectId,
        variant,
      }));

      // 3. Находим голоса в localStorage, которых нет на сервере (для миграции)
      const localVotesToMigrate: Array<{ effectId: string; variant: 'A' | 'B' }> = [];
      for (const localVote of localVotesArray) {
        if (!serverVotesMap.has(localVote.effectId)) {
          localVotesToMigrate.push(localVote);
        }
      }

      // 4. Мигрируем локальные голоса на сервер (если есть)
      if (localVotesToMigrate.length > 0) {
        try {
          const migrationPromise = migrateLocalVotes(vid, localVotesToMigrate);
          const migrationResult = await Promise.race([
            migrationPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Migration timeout')), 10000))
          ]) as Awaited<ReturnType<typeof migrateLocalVotes>>;
          
          // После миграции перезагружаем список серверных голосов
          if (migrationResult.migrated > 0) {
            const refreshPromise = getUserVotedEffects(vid);
            serverVotes = await Promise.race([
              refreshPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('Refresh timeout')), 5000))
            ]) as Awaited<ReturnType<typeof getUserVotedEffects>>;
            
            serverVotesMap.clear();
            serverVotes.forEach(v => {
              serverVotesMap.set(v.effectId, v.variant);
            });
          }
        } catch (migrationError) {
          // Продолжаем работу даже если миграция не удалась
        }
      }

      // 5. Синхронизируем localStorage с сервером (обновляем локальный стор)
      // Используем актуальный список серверных голосов (после миграции, если была)
      const finalServerVotes = serverVotesMap.size > 0 
        ? Array.from(serverVotesMap.entries()).map(([effectId, variant]) => ({ effectId, variant }))
        : serverVotes;
      
      // Получаем актуальный localStorage (на случай, если он изменился во время миграции)
      const currentLocalVotes = votesStore.get();
      
      // Добавляем голоса, которые есть на сервере, но отсутствуют в localStorage
      let syncedCount = 0;
      for (const serverVote of finalServerVotes) {
        if (!currentLocalVotes[serverVote.effectId]) {
          votesStore.set(serverVote.effectId, serverVote.variant);
          syncedCount++;
        }
      }
      
      // syncedCount учитывается внутренне

      // 6. Получаем финальный счетчик голосов (после синхронизации)
      let count = serverVotesMap.size;
      if (count === 0) {
        try {
          const countPromise = getUserVoteCount(vid);
          count = await Promise.race([
            countPromise,
            new Promise<number>((_, reject) => setTimeout(() => reject(new Error('Count timeout')), 5000))
          ]) as number;
        } catch (countError) {
          // Используем размер мапы как fallback
          count = serverVotesMap.size;
        }
      }
      setVoteCount(count);
      setIsUnlocked(count >= REQUIRED_VOTES);
      
      // Проверка на выход из Изнанки, если голоса сбросились
      if (count < REQUIRED_VOTES && isUpsideDown) {
        setIsUpsideDown(false);
        sessionStorage.setItem('reality-mode', 'normal');
      }

      // При первой загрузке восстанавливаем без анимации (только если mounted)
      // Не перезаписываем состояние, если оно уже установлено из useState инициализатора
      if (mounted && !isTransitioning) {
          const savedState = sessionStorage.getItem('reality-mode');
          if (savedState === 'upside-down' && count >= REQUIRED_VOTES && !isUpsideDown) {
            setIsUpsideDown(true);
          } else if (savedState !== 'upside-down' && isUpsideDown) {
            setIsUpsideDown(false);
          }
      }
    } catch (error) {
      // В случае ошибки используем только локальный счетчик
      const localCount = Object.keys(votesStore.get()).length;
      setVoteCount(localCount);
      setIsUnlocked(localCount >= REQUIRED_VOTES);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isUpsideDown, mounted, isTransitioning]);
  
  // Debounced версия checkStatus для использования из компонентов
  const debouncedCheckStatus = useCallback(() => {
    // Очищаем предыдущий таймаут
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Устанавливаем новый таймаут (1 секунда задержка для быстрого отклика)
    syncTimeoutRef.current = setTimeout(() => {
      checkStatus();
    }, 1000);
  }, [checkStatus]);

  // Загружаем данные ТОЛЬКО ОДИН РАЗ при старте
  useEffect(() => {
    setMounted(true);
    checkStatus();
    
    // Очистка таймаута при размонтировании
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [checkStatus]);

  useEffect(() => {
    if (isUpsideDown) {
      document.documentElement.classList.add('mode-upside-down');
    } else {
      document.documentElement.classList.remove('mode-upside-down');
    }
  }, [isUpsideDown]);

  const toggleReality = useCallback(async () => {
    if (!isUnlocked || isTransitioning) return;
    
    // 1. Запускаем анимацию (короткую)
    setIsTransitioning(true);

    // 2. Ждем 1.2 секунды (время RGB-сдвига)
    await new Promise(resolve => setTimeout(resolve, 1200));

    // 3. Переключаем реальность
    const newState = !isUpsideDown;
    setIsUpsideDown(newState);
    sessionStorage.setItem('reality-mode', newState ? 'upside-down' : 'normal');

    // 4. Выключаем анимацию
    setIsTransitioning(false);
  }, [isUnlocked, isTransitioning, isUpsideDown]);

  // Мгновенное обновление (Optimistic UI)
  const incrementVotes = useCallback(() => {
    setVoteCount(prev => {
      const newCount = prev + 1;
      if (newCount >= REQUIRED_VOTES && !isUnlocked) {
        setIsUnlocked(true);
      }
      return newCount;
    });
    
    // Запускаем отложенную синхронизацию (debounced)
    debouncedCheckStatus();
  }, [isUnlocked, debouncedCheckStatus]);
  
  // Обновленная версия refreshVotes с debounce
  const refreshVotes = useCallback(async () => {
    debouncedCheckStatus();
  }, [debouncedCheckStatus]);

  // Мемоизируем значение контекста для предотвращения лишних ре-рендеров
  const contextValue = useMemo(() => ({
    isUpsideDown, 
    toggleReality, 
    isUnlocked, 
    voteCount,
    requiredVotes: REQUIRED_VOTES,
    refreshVotes,
    incrementVotes,
    isTransitioning
  }), [isUpsideDown, isUnlocked, voteCount, isTransitioning, refreshVotes, incrementVotes]);

  return (
    <RealityContext.Provider value={contextValue}>
      {children}
    </RealityContext.Provider>
  );
}

export function useReality() {
  const context = useContext(RealityContext);
  if (context === undefined) {
    throw new Error('useReality must be used within a RealityProvider');
  }
  return context;
}
