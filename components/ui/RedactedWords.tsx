'use client';

import { useReality } from '@/lib/context/RealityContext';
import { useMemo, useState } from 'react';

interface RedactedWordsProps {
  text: string;
  minWords?: number;
  maxWords?: number;
  seed?: string; // Для детерминированного выбора слов
  onRedactHover?: (isHovered: boolean) => void; // Колбэк для подсветки внешних элементов
}

export default function RedactedWords({ 
  text, 
  minWords = 1, 
  maxWords = 5,
  seed = '',
  onRedactHover
}: RedactedWordsProps) {
  const { isUpsideDown } = useReality();
  const [hoveredWord, setHoveredWord] = useState<number | null>(null);

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
          // В Реальности - черный маркер с tooltip (слово остается черным)
          const isHovered = hoveredWord === i;
          return (
            <span 
              key={i} 
              className="relative inline-block align-middle select-none group/redact cursor-help"
              onMouseEnter={() => {
                setHoveredWord(i);
                onRedactHover?.(true);
              }}
              onMouseLeave={() => {
                setHoveredWord(null);
                onRedactHover?.(false);
              }}
            >
              <span 
                className="bg-black text-black font-bold px-1 py-0.5 inline-block transition-all duration-300"
                style={{ 
                  borderRadius: '2px',
                  boxShadow: 'inset 0 -0.2em 0 rgba(0,0,0,1), 0 0.05em 0.1em rgba(0,0,0,0.2)',
                  lineHeight: '1.4',
                }}
              >
                {part}
              </span>
              
              {/* Tooltip */}
              {isHovered && (
                <span 
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-cyan-950/95 border border-cyan-500/50 rounded-lg text-white text-xs font-mono whitespace-nowrap pointer-events-none z-[100] shadow-xl backdrop-blur-sm shadow-cyan-500/20"
                  style={{
                    animation: 'fadeIn 0.2s ease-out',
                    boxShadow: '0 10px 25px rgba(6, 182, 212, 0.3), 0 0 15px rgba(6, 182, 212, 0.2)'
                  }}
                >
                  <span className="text-cyan-400 mr-1.5">⚠</span>
                  <span>Данные недоступны в реальности</span>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-cyan-500/50" />
                </span>
              )}
            </span>
          );
        }
      }
      
      return <span key={i}>{part}</span>;
    });
  }, [text, isUpsideDown, minWords, maxWords, seed, hoveredWord]);

  return <>{processedText}</>;
}

