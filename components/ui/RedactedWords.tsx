'use client';

import { useReality } from '@/lib/context/RealityContext';
import { useMemo } from 'react';

interface RedactedWordsProps {
  text: string;
  minWords?: number;
  maxWords?: number;
  seed?: string; // Для детерминированного выбора слов
}

export default function RedactedWords({ 
  text, 
  minWords = 1, 
  maxWords = 5,
  seed = ''
}: RedactedWordsProps) {
  const { isUpsideDown } = useReality();

  const processedText = useMemo(() => {
    // Разбиваем текст на слова, сохраняя пробелы
    const parts = text.split(/(\s+)/);
    
    // Находим индексы реальных слов длиннее 4 символов (исключаем предлоги)
    const wordIndices: number[] = [];
    parts.forEach((part, i) => {
      const trimmed = part.trim();
      if (trimmed.length > 4 && !/^\s+$/.test(part)) {
        wordIndices.push(i);
      }
    });
    
    if (wordIndices.length === 0) {
      return <>{text}</>;
    }
    
    // Детерминированный выбор количества слов для цензуры на основе seed
    const numToRedact = seed 
      ? Math.floor((seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % (maxWords - minWords + 1)) + minWords
      : Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    
    // Детерминированный выбор индексов слов для цензуры
    const selectedWordIndices = new Set<number>();
    let seedValue = seed ? seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.random() * 1000;
    
    while (selectedWordIndices.size < Math.min(numToRedact, wordIndices.length)) {
      const idx = Math.floor(seedValue % wordIndices.length);
      selectedWordIndices.add(wordIndices[idx]);
      seedValue = (seedValue * 7 + 13) % 1000; // Простой генератор для детерминированности
    }
    
    // Обрабатываем части текста
    return parts.map((part, i) => {
      const isWord = part.trim().length > 0 && !/^\s+$/.test(part);
      
      if (!isWord) {
        return <span key={i}>{part}</span>;
      }
      
      const shouldRedact = selectedWordIndices.has(i);
      
      if (shouldRedact) {
        if (isUpsideDown) {
          // В Изнанке - красный текст
          return (
            <span key={i} className="text-stranger-red font-bold px-1">
              {part}
            </span>
          );
        } else {
          // В Реальности - черный маркер (без четких границ, как жирный маркер)
          return (
            <span key={i} className="relative inline-block align-middle select-none">
              <span 
                className="bg-black text-black font-bold px-1 py-0.5 inline-block"
                style={{ 
                  borderRadius: '2px',
                  boxShadow: 'inset 0 -0.2em 0 rgba(0,0,0,1), 0 0.05em 0.1em rgba(0,0,0,0.2)',
                  lineHeight: '1.4',
                }}
              >
                {part}
              </span>
            </span>
          );
        }
      }
      
      return <span key={i}>{part}</span>;
    });
  }, [text, isUpsideDown, minWords, maxWords, seed]);

  return <>{processedText}</>;
}

