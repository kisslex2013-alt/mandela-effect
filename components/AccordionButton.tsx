'use client';

import { motion } from 'framer-motion';

interface AccordionButtonProps {
  title: string;
  icon?: string;
  isOpen: boolean;
  onClick: () => void;
}

export default function AccordionButton({
  title,
  icon = '📖',
  isOpen,
  onClick,
}: AccordionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-darkCard rounded-xl hover:bg-darkCard/80 transition-all group"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-lg font-semibold text-light">{title}</span>
      </div>
      
      <motion.svg
        className="w-6 h-6 text-light/60 group-hover:text-light transition-colors"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <path d="M19 9l-7 7-7-7" />
      </motion.svg>
    </button>
  );
}
