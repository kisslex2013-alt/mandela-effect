'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Главная' },
  { href: '/catalog', label: 'Каталог' },
  { href: '/my-memory', label: 'Моя память' },
  { href: '/stats', label: 'Статистика' },
  { href: '/submit', label: 'Добавить' },
];

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Закрываем мобильное меню при изменении пути
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Блокируем скролл когда мобильное меню открыто
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 h-16 px-4 md:px-8 transition-all duration-300 ${
          isScrolled
            ? 'bg-dark/80 backdrop-blur-md shadow-lg'
            : 'bg-dark'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Логотип */}
          <Link
            href="/"
            className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            Эффект Манделы
          </Link>

          {/* Desktop навигация */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative text-light/80 hover:text-light transition-colors ${
                    isActive ? 'text-light' : ''
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-transform origin-left ${
                      isActive
                        ? 'scale-x-100'
                        : 'scale-x-0 hover:scale-x-100'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Пустое место справа для будущих кнопок */}
          <div className="hidden md:block w-24" />

          {/* Mobile бургер-меню */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-light hover:text-primary transition-colors p-2"
            aria-label="Меню"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile меню overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-transform duration-300 ${
          isMobileMenuOpen
            ? 'translate-x-0'
            : 'translate-x-full'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-dark/90 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Меню панель */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-darkCard shadow-2xl overflow-y-auto">
          <div className="p-8">
            {/* Кнопка закрытия */}
            <div className="flex justify-end mb-8">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-light hover:text-primary transition-colors p-2"
                aria-label="Закрыть"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Пункты меню */}
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-xl font-semibold py-4 px-6 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-primary to-secondary text-light'
                        : 'text-light/80 hover:text-light hover:bg-dark'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Spacer для фиксированного header */}
      <div className="h-16" />
    </>
  );
}

