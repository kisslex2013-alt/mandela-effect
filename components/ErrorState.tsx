'use client';

import { motion } from 'framer-motion';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'Что-то пошло не так',
  message = 'Произошла ошибка при загрузке данных',
  onRetry,
}: ErrorStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-8xl mb-6"
        animate={{
          rotate: [0, -10, 10, -10, 10, 0],
        }}
        transition={{
          duration: 0.5,
          ease: 'easeInOut',
        }}
      >
        ⚠️
      </motion.div>

      <h3 className="text-2xl font-bold text-light mb-2">{title}</h3>
      <p className="text-light/70 mb-6 text-center max-w-md">{message}</p>

      {onRetry && (
        <motion.button
          onClick={onRetry}
          className="px-6 py-3 bg-primary text-light rounded-lg font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Попробовать снова
        </motion.button>
      )}
    </motion.div>
  );
}

