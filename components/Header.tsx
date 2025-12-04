'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Скрываем Header на странице админки
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Отслеживаем скролл для микро-эффектов (опционально)
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Главная', path: '/' },
    { name: 'Каталог', path: '/catalog' },
    { name: 'Моя память', path: '/my-memory' },
    { name: 'Статистика', path: '/stats' },
    { name: 'Добавить', path: '/submit' }, // Убрали "эффект", чтобы короче
  ];

  return (
    <>
      <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className={`
            relative flex items-center justify-between 
            w-full max-w-5xl px-6 py-3 
            bg-black/60 backdrop-blur-xl border border-white/10 
            rounded-full shadow-2xl shadow-purple-500/5
            transition-all duration-300
            ${mobileMenuOpen ? 'rounded-2xl' : ''} 
          `}
        >
          {/* Логотип */}
          <Link href="/" className="group relative flex items-center gap-2 z-50" onClick={() => setMobileMenuOpen(false)}>
            <div className="relative w-8 h-8 flex items-center justify-center bg-gradient-to-br from-primary to-purple-600 rounded-lg overflow-hidden group-hover:animate-pulse">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-white leading-none group-hover:text-primary transition-colors">
                MANDELA
              </span>
              <span className="text-[9px] text-light/50 font-mono tracking-[0.2em] group-hover:text-light transition-colors">
                EFFECT
              </span>
            </div>
          </Link>

          {/* Десктоп Меню */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`
                    relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                    ${isActive 
                      ? 'text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                      : 'text-light/60 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 rounded-full border border-white/20"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Мобильная кнопка */}
          <button 
            className="md:hidden p-2 text-white/80 hover:text-white z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>

          {/* Мобильное Меню (Выпадающее) */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="absolute top-full left-0 right-0 bg-darkCard/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden md:hidden shadow-2xl flex flex-col p-2 mx-2"
              >
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      px-4 py-3 rounded-xl text-sm font-bold transition-colors
                      ${pathname === item.path 
                        ? 'bg-primary/20 text-primary' 
                        : 'text-light/70 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </header>
      
      {/* Компенсатор высоты (чтобы контент не уезжал под хедер, так как он fixed) */}
      {/* Мы не добавляем его здесь, так как хедер "парящий" и прозрачный, контент должен красиво уходить под него */}
    </>
  );
}
