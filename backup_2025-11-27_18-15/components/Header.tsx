'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Главная' },
  { href: '/catalog', label: 'Каталог' },
  { href: '/my-memory', label: 'Моя память' },
  { href: '/stats', label: 'Статистика' },
  { href: '/submit', label: 'Добавить' },
];

export default function Header() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      
      // Показываем/скрываем header
      const isScrollingDown = currentScrollPos > prevScrollPos;
      
      if (currentScrollPos < 10) {
        // Всегда показываем наверху
        setIsVisible(true);
      } else if (isScrollingDown && currentScrollPos > 150) {
        // Скрываем при скролле вниз
        setIsVisible(false);
      } else if (!isScrollingDown) {
        // Показываем при скролле вверх
        setIsVisible(true);
      }
      
      // Меняем стиль при скролле
      setIsScrolled(currentScrollPos > 50);
      
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s ease-in-out, background-color 0.3s, backdrop-filter 0.3s',
          backgroundColor: isScrolled ? 'rgba(10, 10, 10, 0.8)' : 'rgba(10, 10, 10, 0.95)',
          backdropFilter: isScrolled ? 'blur(12px)' : 'blur(4px)',
          boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.3)' : 'none',
        }}
      >
        {/* Прогресс-бар чтения */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"
          style={{
            scaleX: scrollYProgress,
            transformOrigin: '0%',
          }}
        />

        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Логотип */}
            <Link href="/">
              <div
                className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary cursor-pointer select-none"
                style={{
                  transform: isScrolled ? 'scale(0.9)' : 'scale(1)',
                  transition: 'transform 0.2s ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = isScrolled ? 'scale(0.95)' : 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = isScrolled ? 'scale(0.9)' : 'scale(1)';
                }}
              >
                Эффект Манделы
              </div>
            </Link>

            {/* Навигация */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <div
                      className={`relative px-3 py-2 rounded-lg cursor-pointer select-none ${
                        isActive
                          ? 'text-light bg-primary/20'
                          : 'text-light/80'
                      }`}
                      style={{
                        transition: 'all 0.2s ease-out',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.color = 'rgb(248, 248, 242)';
                          e.currentTarget.style.backgroundColor = 'rgba(248, 248, 242, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.color = 'rgba(248, 248, 242, 0.8)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {link.label}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-light/80 hover:text-light hover:bg-light/5 transition-all"
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>
        {/* Мобильное меню */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-light/10"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link key={link.href} href={link.href}>
                      <div
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? 'bg-primary/20 text-light'
                            : 'text-light/80 hover:bg-light/5 hover:text-light'
                        }`}
                      >
                        {link.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Отступ */}
      <div className="h-16" />
    </>
  );
}
