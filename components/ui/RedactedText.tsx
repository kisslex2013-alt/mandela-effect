'use client';

import { useReality } from '@/lib/context/RealityContext';
import { useState, useEffect } from 'react';

interface RedactedTextProps {
  text: string;
  className?: string;
}

export default function RedactedText({ text, className = "" }: RedactedTextProps) {
  const { isUpsideDown } = useReality();
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    setWords(text.split(' '));
  }, [text]);

  if (!isUpsideDown) {
    return <p className={className}>{text}</p>;
  }

  return (
    <p className={className}>
      {words.map((word, i) => {
        // Случайным образом выбираем слова для цензуры (примерно 30%)
        // Используем простой хэш от индекса и длины слова для стабильности при ре-рендере
        const shouldRedact = (i * word.length) % 3 === 0; 
        
        if (!shouldRedact) return <span key={i}>{word} </span>;

        return (
          <span key={i} className="relative inline-block group cursor-help mr-1">
            <span className="bg-black text-black px-1 rounded-sm select-none transition-all duration-300 group-hover:bg-transparent group-hover:text-red-500 group-hover:font-bold">
              {word}
            </span>
            {/* Декоративная линия "маркера" */}
            <span className="absolute inset-0 bg-red-900/50 opacity-0 group-hover:opacity-20 pointer-events-none" />
          </span>
        );
      })}
    </p>
  );
}
