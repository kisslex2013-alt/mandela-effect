'use client';

import { useState, useEffect, useCallback } from 'react';

// Глобальный контекст, чтобы не создавать его 100 раз
let globalAudioCtx: AudioContext | null = null;

export function useSound() {
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Восстанавливаем настройку Mute
    const saved = localStorage.getItem('sound-muted');
    if (saved) setIsMuted(JSON.parse(saved));

    // Функция "прогрева" аудио при первом клике
    const interactHandler = () => {
      if (!globalAudioCtx) {
        globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume().then(() => {
          setIsReady(true);
        }).catch(console.error);
      } else {
        setIsReady(true);
      }
    };

    // Слушаем клик по всему окну, чтобы разблокировать звук
    window.addEventListener('click', interactHandler, { once: true });
    window.addEventListener('touchstart', interactHandler, { once: true });
    window.addEventListener('keydown', interactHandler, { once: true });

    return () => {
      window.removeEventListener('click', interactHandler);
      window.removeEventListener('touchstart', interactHandler);
      window.removeEventListener('keydown', interactHandler);
    };
  }, []);

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    localStorage.setItem('sound-muted', JSON.stringify(newState));
  };

  // Универсальная функция генерации звука
  const playTone = (freq: number, type: OscillatorType, duration: number, vol: number) => {
    if (isMuted || !globalAudioCtx || globalAudioCtx.state === 'suspended') return;

    try {
      const osc = globalAudioCtx.createOscillator();
      const gain = globalAudioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, globalAudioCtx.currentTime);
      
      gain.gain.setValueAtTime(vol, globalAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, globalAudioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(globalAudioCtx.destination);

      osc.start();
      osc.stop(globalAudioCtx.currentTime + duration);
    } catch (e) {
      // Игнорируем ошибки, если аудио отвалилось
    }
  };

  const playClick = useCallback(() => {
    // "Blip" звук (Sine волна)
    playTone(600, 'sine', 0.15, 0.1);
  }, [isMuted]);

  const playHover = useCallback(() => {
    // Тихий щелчок (Triangle волна)
    playTone(800, 'triangle', 0.05, 0.02);
  }, [isMuted]);

  return { isMuted, toggleMute, playClick, playHover };
}
