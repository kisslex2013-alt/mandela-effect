'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string | ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionLabel?: string; // Алиас для actionText
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = '🔍',
  title,
  description,
  actionText,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  // Поддержка обоих вариантов: actionText и actionLabel
  const buttonText = actionText || actionLabel;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-darkCard p-8 md:p-12 rounded-2xl border border-light/10 text-center"
    >
      <div className="flex justify-center mb-6">
        {typeof icon === 'string' ? (
          <span className="text-6xl">{icon}</span>
        ) : (
          icon
        )}
      </div>
      
      <h3 className="text-2xl font-bold text-light mb-3">{title}</h3>
      
      <p className="text-light/60 mb-6 max-w-md mx-auto">{description}</p>
      
      {(buttonText && actionHref) && (
        <Link href={actionHref}>
          <button className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
            {buttonText}
          </button>
        </Link>
      )}
      
      {(buttonText && onAction && !actionHref) && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          {buttonText}
        </button>
      )}
    </motion.div>
  );
}

/**
 * Скелетон-заглушка для карточки эффекта
 */
export function EffectCardSkeleton() {
  return (
    <div className="bg-darkCard p-6 rounded-xl border border-light/10 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-dark/50 rounded" />
        <div className="h-5 w-16 bg-dark/50 rounded" />
      </div>
      <div className="h-6 w-3/4 bg-dark/50 rounded mb-2" />
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-dark/50 rounded" />
        <div className="h-4 w-2/3 bg-dark/50 rounded" />
      </div>
      <div className="h-2 w-full bg-dark/50 rounded-full mb-2" />
      <div className="flex justify-between">
        <div className="h-3 w-20 bg-dark/50 rounded" />
        <div className="h-3 w-16 bg-dark/50 rounded" />
      </div>
    </div>
  );
}

/**
 * Скелетон для "Самое спорное"
 */
export function ControversialSkeleton() {
  return (
    <div className="bg-darkCard p-8 rounded-2xl border-2 border-light/10 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-dark/50 rounded" />
        <div className="h-8 w-64 bg-dark/50 rounded" />
      </div>
      <div className="space-y-2 mb-6">
        <div className="h-6 w-full bg-dark/50 rounded" />
        <div className="h-6 w-3/4 bg-dark/50 rounded" />
      </div>
      <div className="h-3 w-full bg-dark/50 rounded-full mb-4" />
      <div className="h-4 w-32 bg-dark/50 rounded mx-auto mb-6" />
      <div className="h-12 w-64 bg-dark/50 rounded-lg mx-auto" />
    </div>
  );
}

/**
 * Пустое состояние для главной страницы
 */
export function HomeEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-darkCard p-8 md:p-12 rounded-2xl border-2 border-dashed border-light/20 text-center"
    >
      <div className="text-7xl mb-6">🧠</div>
      
      <h3 className="text-2xl md:text-3xl font-bold text-light mb-4">
        Добро пожаловать в мир Эффекта Манделы!
      </h3>
      
      <p className="text-light/60 mb-8 max-w-lg mx-auto text-lg">
        Пока здесь пусто, но скоро появятся интересные эффекты для исследования.
        Хотите предложить свой?
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/submit">
          <button className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
            ✨ Предложить эффект
          </button>
        </Link>
        
        <Link href="/about">
          <button className="px-8 py-4 bg-dark border border-light/20 text-light font-semibold rounded-xl hover:border-light/40 transition-colors">
            ℹ️ Что такое Эффект Манделы?
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
