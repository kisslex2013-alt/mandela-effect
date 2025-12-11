'use client';

import { useState, useEffect } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+-=[]{}|;:,.<>?';

interface CipherRevealProps {
  text: string;
  reveal?: boolean;
  className?: string;
}

export default function CipherReveal({ text, reveal = true, className = '' }: CipherRevealProps) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!reveal) {
      setDisplay(text);
      return;
    }

    // Сбрасываем на случайные символы при начале анимации
    setDisplay(text.split('').map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join(''));

    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(prev => 
        text
          .split('')
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        setDisplay(text); // Убеждаемся, что финальный текст правильный
      }

      iteration += 1 / 2; // Скорость расшифровки
    }, 30);

    return () => clearInterval(interval);
  }, [text, reveal]);

  return <span className={className}>{display}</span>;
}

