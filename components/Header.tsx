'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { m } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Menu, X, PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import RealitySwitch from './ui/RealitySwitch';
import { useReality } from '@/lib/context/RealityContext';

const navItems = [
  { name: 'Главная', href: '/' },
  { name: 'Каталог', href: '/catalog' },
  { name: 'Память', href: '/my-memory' },
  { name: 'Статистика', href: '/stats' },
  { name: 'Как устроено', href: '/how-it-works' },
  { name: 'О проекте', href: '/about' },
];

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isUpsideDown } = useReality(); // Подключили контекст

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Скрываем Header на странице админки
  const isAdmin = pathname?.startsWith('/admin');
  if (isAdmin) return null;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        isScrolled
          ? 'bg-dark/80 backdrop-blur-xl border-white/10 py-3'
          : 'bg-transparent border-transparent py-5'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group relative z-50">
          <div className={cn(
            "w-8 h-8 rounded flex items-center justify-center font-bold text-lg shadow-lg transition-all duration-500",
            isUpsideDown 
              ? "bg-stranger-red text-black rotate-180 shadow-[0_0_15px_rgba(220,38,38,0.6)]" // Переворот M -> W
              : "bg-gradient-to-br from-cyan-500 to-purple-600 text-white group-hover:shadow-cyan-500/50"
          )}>
            M
          </div>
          <span className={cn(
            "font-bold text-xl tracking-tight hidden sm:block transition-colors duration-300",
            isUpsideDown 
              ? "text-stranger-red font-black tracking-widest" // Красный логотип
              : "text-white group-hover:text-cyan-400"
          )}>
            {/* Анимация переворота первой буквы M -> W */}
            <span className={cn("inline-block transition-transform duration-500 origin-center", isUpsideDown && "rotate-180")}>M</span>
            ANDELA<span className={isUpsideDown ? "text-white" : "text-purple-500"}>EFFECT</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-full px-2 py-1 border border-white/5 backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative',
                  isActive
                    ? 'text-white'
                    : 'text-light/60 hover:text-white hover:bg-white/5'
                )}
              >
                {isActive && (
                  <m.div
                    layoutId="nav-pill"
                    className={cn(
                      "absolute inset-0 rounded-full border",
                      isUpsideDown 
                        ? "bg-stranger-red/20 border-stranger-red/50" 
                        : "bg-white/10 border-white/10"
                    )}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 relative z-50">
          <RealitySwitch />

          <Link href="/submit">
            <button className={cn(
              "hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all shadow-lg hover:-translate-y-0.5",
              isUpsideDown
                ? "bg-stranger-red hover:bg-red-700 shadow-red-900/20"
                : "bg-primary hover:bg-primary/90 shadow-primary/20 hover:shadow-primary/40"
            )}>
              <PlusCircle className="w-4 h-4" />
              <span>Добавить</span>
            </button>
          </Link>

          <button
            className="md:hidden p-2 text-light/80 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-full left-0 right-0 bg-dark/95 backdrop-blur-xl border-b border-white/10 p-4 md:hidden flex flex-col gap-2 shadow-2xl"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'p-4 rounded-xl text-lg font-medium border border-transparent',
                pathname === item.href
                  ? 'bg-white/10 text-white border-white/10'
                  : 'text-light/60 hover:bg-white/5 hover:text-white'
              )}
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/submit"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-4 rounded-xl text-lg font-medium bg-primary/20 text-primary border border-primary/20 flex items-center justify-center gap-2 mt-2"
          >
            <PlusCircle className="w-5 h-5" />
            Предложить эффект
          </Link>
        </m.div>
      )}
    </header>
  );
}
