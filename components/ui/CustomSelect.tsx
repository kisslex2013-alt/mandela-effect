'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  emoji?: string; // Оставляем для совместимости
  icon?: ReactNode; // Новое поле для иконок
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  label,
  disabled = false,
  error,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-light/40 uppercase mb-2 ml-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 
          bg-dark border rounded-xl 
          text-left flex items-center justify-between gap-2
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-light/30'}
          ${error ? 'border-red-500 focus:border-red-500' : 'border-light/10 focus:border-primary'}
          ${isOpen ? 'border-primary ring-1 ring-primary/50' : ''}
        `}
      >
        <span className={`flex items-center gap-2 text-sm ${selectedOption ? 'text-light' : 'text-light/40'}`}>
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="w-4 h-4">{selectedOption.icon}</span>}
              {selectedOption.emoji && !selectedOption.icon && <span>{selectedOption.emoji}</span>}
              <span>{selectedOption.label}</span>
            </>
          ) : (
            placeholder
          )}
        </span>

        <ChevronDown className={`w-4 h-4 text-light/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 w-full mt-2 bg-darkCard border border-light/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1"
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-light/40 text-sm text-center">Нет опций</div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm
                    flex items-center gap-2
                    transition-colors duration-150
                    ${option.value === value ? 'bg-primary/10 text-primary' : 'text-light/80 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  {option.icon && <span className="w-4 h-4 opacity-70">{option.icon}</span>}
                  {option.emoji && !option.icon && <span className="text-base">{option.emoji}</span>}
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.value === value && <Check className="w-4 h-4" />}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
