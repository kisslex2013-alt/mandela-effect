'use client';

import { useState, useRef, useEffect } from 'react';
import EmojiPicker, { Theme, EmojiStyle, EmojiClickData } from 'emoji-picker-react';

interface EmojiPickerInputProps {
  value: string;
  onChange: (emoji: string) => void;
  label?: string;
  placeholder?: string;
}

export default function EmojiPickerInput({
  value,
  onChange,
  label,
  placeholder = '😀',
}: EmojiPickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Закрытие при нажатии Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-light/80 mb-2">
          {label}
        </label>
      )}

      {/* Кнопка выбора эмодзи */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 
          bg-dark border rounded-xl 
          text-left flex items-center justify-between gap-2
          transition-all duration-200
          cursor-pointer hover:border-light/30
          ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-light/20'}
        `}
      >
        <span className="text-2xl">
          {value || placeholder}
        </span>
        <span className="text-light/40 text-sm">
          {value ? 'Изменить' : 'Выбрать'}
        </span>
      </button>

      {/* Выпадающее окно с пикером */}
      {isOpen && (
        <>
          {/* Overlay для закрытия */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Пикер */}
          <div className="absolute top-full left-0 mt-2 z-50">
            <div className="relative">
              {/* Кнопка закрытия */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
              >
                ✕
              </button>
              
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={Theme.DARK}
                emojiStyle={EmojiStyle.NATIVE}
                lazyLoadEmojis={true}
                width={350}
                height={400}
                searchPlaceholder="Поиск эмодзи..."
                previewConfig={{ showPreview: false }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

