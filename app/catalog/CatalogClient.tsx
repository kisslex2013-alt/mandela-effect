'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/lib/hooks/useDebounce';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import CustomSelect from '@/components/ui/CustomSelect';
import Toggle from '@/components/ui/Toggle';
import { getUserVotes } from '@/app/actions/votes';
import { getVisitorId } from '@/lib/visitor';
import type { EffectResult } from '@/app/actions/effects';

// Маппинг категорий на эмодзи и названия
const categoryMap: Record<string, { emoji: string; name: string }> = {
  films: { emoji: '🎬', name: 'Фильмы/ТВ' },
  brands: { emoji: '🏢', name: 'Бренды' },
  music: { emoji: '🎵', name: 'Музыка' },
  popculture: { emoji: '🎨', name: 'Поп-культура' },
  childhood: { emoji: '🧸', name: 'Детство' },
  people: { emoji: '👤', name: 'Люди' },
  geography: { emoji: '🌍', name: 'География' },
  history: { emoji: '📜', name: 'История' },
  science: { emoji: '🔬', name: 'Наука' },
  other: { emoji: '❓', name: 'Другое' },
};

interface CatalogClientProps {
  initialEffects: EffectResult[];
  categories: string[];
  initialCategory: string | null;
}

type SortOption = 'popularity' | 'controversy' | 'newest' | 'alphabetical';

export default function CatalogClient({ 
  initialEffects, 
  categories, 
  initialCategory 
}: CatalogClientProps) {
  const [allEffects] = useState<EffectResult[]>(initialEffects);
  const [loading] = useState(false);
  const [votedEffectIds, setVotedEffectIds] = useState<string[]>([]);
  
  // Фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [onlyUnvoted, setOnlyUnvoted] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  // Debounce для поиска
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Загрузка голосов из БД и localStorage
  useEffect(() => {
    const loadVotes = async () => {
      const visitorId = getVisitorId();
      const votedIds: string[] = [];

      console.log('[Catalog] Загрузка голосов, visitorId:', visitorId?.substring(0, 20) + '...');

      // 1. Загружаем голоса из БД
      if (visitorId) {
        try {
          const serverVotes = await getUserVotes(visitorId);
          console.log('[Catalog] ✅ Загружено голосов из БД:', serverVotes.totalVotes);
          serverVotes.votes.forEach((vote) => {
            votedIds.push(vote.effectId);
          });
        } catch (error) {
          console.error('[Catalog] ❌ Ошибка загрузки голосов из БД:', error);
        }
      }

      // 2. Добавляем голоса из localStorage (fallback)
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('voted_effect_')) {
            const id = key.replace('voted_effect_', '');
            if (!votedIds.includes(id)) {
              votedIds.push(id);
            }
          }
        }
      }

      setVotedEffectIds(votedIds);
    };

    loadVotes();

    // Слушаем события обновления голосов
    const handleVoteUpdate = () => {
      loadVotes();
    };
    window.addEventListener('voteUpdated', handleVoteUpdate);

    return () => {
      window.removeEventListener('voteUpdated', handleVoteUpdate);
    };
  }, []);

  // Фильтрация и сортировка
  const filteredAndSortedEffects = useMemo(() => {
    let filtered = [...allEffects];

    // Поиск
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (effect) =>
          effect.title.toLowerCase().includes(query) ||
          effect.description.toLowerCase().includes(query)
      );
    }

    // Категории
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((effect) =>
        selectedCategories.includes(effect.category)
      );
    }

    // Только не проголосованные
    if (onlyUnvoted) {
      filtered = filtered.filter((effect) => !votedEffectIds.includes(effect.id));
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity': {
          const totalA = a.votesFor + a.votesAgainst;
          const totalB = b.votesFor + b.votesAgainst;
          return totalB - totalA;
        }
        case 'controversy': {
          const totalA = a.votesFor + a.votesAgainst;
          const totalB = b.votesFor + b.votesAgainst;
          if (totalA === 0 && totalB === 0) return 0;
          if (totalA === 0) return 1;
          if (totalB === 0) return -1;

          const percentA = (a.votesFor / totalA) * 100;
          const percentB = (b.votesFor / totalB) * 100;
          const diffA = Math.abs(50 - percentA);
          const diffB = Math.abs(50 - percentB);
          return diffA - diffB;
        }
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title, 'ru');
        default:
          return 0;
      }
    });

    return filtered;
  }, [allEffects, debouncedSearch, selectedCategories, sortBy, onlyUnvoted, votedEffectIds]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...categories]);
    }
  };

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#categories-dropdown') && !target.closest('#categories-button')) {
        setIsCategoriesOpen(false);
      }
    };

    if (isCategoriesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoriesOpen]);

  return (
    <main id="main-content" className="min-h-screen bg-dark py-16 px-4" role="main">
      <div className="max-w-7xl mx-auto">
        <motion.h1 
          className="text-4xl md:text-5xl font-bold mb-8 text-center text-light"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Каталог эффектов
        </motion.h1>

        {/* Панель фильтров */}
        <motion.div 
          className="bg-darkCard rounded-xl p-6 mb-8 space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Поиск */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Поиск по названию или вопросу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-dark rounded-lg text-light placeholder:text-light/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
              🔍
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Категории */}
            <div className="relative">
              <button
                id="categories-button"
                className={`
                  w-full px-4 py-3 bg-dark border rounded-xl
                  text-light text-left flex items-center justify-between gap-2
                  transition-all duration-200 cursor-pointer
                  ${isCategoriesOpen 
                    ? 'border-primary ring-2 ring-primary/50' 
                    : 'border-light/20 hover:border-light/30'
                  }
                `}
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              >
                <span className="flex items-center gap-2">
                  <span>🏷️</span>
                  <span>
                    Категории{' '}
                    {selectedCategories.length > 0 && (
                      <span className="text-primary">({selectedCategories.length})</span>
                    )}
                  </span>
                </span>
                <svg
                  className={`w-5 h-5 text-light/40 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AnimatePresence>
                {isCategoriesOpen && (
                  <motion.div
                    id="categories-dropdown"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-darkCard border border-light/20 rounded-xl shadow-xl shadow-black/30 z-50 max-h-64 overflow-y-auto py-1"
                  >
                    {/* Все категории */}
                    <button
                      type="button"
                      onClick={handleSelectAllCategories}
                      className={`
                        w-full px-4 py-3 text-left flex items-center justify-between
                        transition-colors duration-150
                        ${selectedCategories.length === categories.length 
                          ? 'bg-primary/20 text-primary' 
                          : 'text-light hover:bg-light/10'
                        }
                      `}
                    >
                      <span className="flex items-center gap-2">
                        <span>📋</span>
                        <span>Все категории</span>
                      </span>
                      {selectedCategories.length === categories.length && (
                        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    <div className="border-t border-light/10 my-1" />
                    
                    {categories.map((category) => {
                      const catInfo = categoryMap[category] || { emoji: '❓', name: category };
                      const isSelected = selectedCategories.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleCategoryToggle(category)}
                          className={`
                            w-full px-4 py-3 text-left flex items-center justify-between
                            transition-colors duration-150
                            ${isSelected 
                              ? 'bg-primary/20 text-primary' 
                              : 'text-light hover:bg-light/10'
                            }
                          `}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{catInfo.emoji}</span>
                            <span>{catInfo.name}</span>
                          </span>
                          {isSelected && (
                            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Сортировка */}
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val as SortOption)}
              options={[
                { value: 'popularity', label: 'По популярности', emoji: '🔥' },
                { value: 'controversy', label: 'По спорности', emoji: '⚖️' },
                { value: 'newest', label: 'По новизне', emoji: '⏰' },
                { value: 'alphabetical', label: 'По алфавиту', emoji: '🔤' },
              ]}
              placeholder="Сортировка"
            />

            {/* Только не пройденные */}
            <div className="px-4 py-3 bg-dark border border-light/20 rounded-xl flex items-center">
              <Toggle
                checked={onlyUnvoted}
                onChange={setOnlyUnvoted}
                label="Только не пройденные"
              />
            </div>
          </div>
        </motion.div>

        {/* Счётчик результатов */}
        <div className="mb-6 text-light/80">
          Показано {filteredAndSortedEffects.length} из {allEffects.length}{' '}
          {allEffects.length === 1 ? 'эффекта' : 'эффектов'}
        </div>

        {/* Сетка эффектов */}
        {loading ? (
          <Loading text="Загружаем эффекты..." size="lg" />
        ) : filteredAndSortedEffects.length === 0 ? (
          <div className="bg-darkCard p-8 rounded-xl">
            <EmptyState
              icon="🔍"
              title="Эффектов не найдено"
              description="Попробуй выбрать другую категорию или сбросить фильтры"
            />
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredAndSortedEffects.map((effect, index) => {
                const totalVotes = effect.votesFor + effect.votesAgainst;
                const percentA =
                  totalVotes > 0 ? Math.round((effect.votesFor / totalVotes) * 100) : 0;
                const percentB =
                  totalVotes > 0 ? Math.round((effect.votesAgainst / totalVotes) * 100) : 0;
                const hasVoted = votedEffectIds.includes(effect.id);
                const questionPreview =
                  effect.description.length > 100
                    ? `${effect.description.substring(0, 100)}...`
                    : effect.description;
                const catInfo = categoryMap[effect.category] || { emoji: '❓', name: effect.category };

                return (
                  <motion.div
                    key={effect.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      y: 0,
                      transition: {
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: 'easeOut',
                      }
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.8,
                      transition: {
                        duration: 0.2,
                      }
                    }}
                  >
                    <Link
                      href={`/effect/${effect.id}`}
                      className="group bg-darkCard rounded-xl p-6 border border-light/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/20 flex flex-col"
                    >
                      {/* Категория */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl transition-transform duration-300 group-hover:scale-125 inline-block">
                          {catInfo.emoji}
                        </span>
                        <span className="text-sm text-light/60">
                          {catInfo.name}
                        </span>
                      </div>

                      {/* Название */}
                      <h3 className="text-xl font-bold text-light mb-3 transition-colors duration-300 group-hover:text-primary">
                        {effect.title}
                      </h3>

                      {/* Разделитель */}
                      <div className="border-b border-dark mb-4" />

                      {/* Вопрос */}
                      <p className="text-light/80 mb-4 flex-grow">{questionPreview}</p>

                      {/* Прогресс-бар */}
                      {totalVotes > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2 text-sm">
                            <span className="text-primary font-semibold">{percentA}%</span>
                            <span className="text-secondary font-semibold">{percentB}%</span>
                          </div>
                          <div className="relative h-2 rounded-full bg-dark/50 overflow-hidden transition-all duration-300 group-hover:shadow-md">
                            <div
                              className="absolute inset-0 rounded-full"
                              style={{
                                background: `linear-gradient(to right, #3b82f6 ${percentA}%, #f59e0b ${percentA}%)`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Количество голосов и статус */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-light/60 transition-all duration-300 group-hover:text-light group-hover:font-semibold">
                          {totalVotes.toLocaleString('ru-RU')} голосов
                        </span>
                        <span
                          className={`font-semibold ${
                            hasVoted ? 'text-green-400' : 'text-light/40'
                          }`}
                        >
                          {hasVoted ? '✓ Проголосовал' : 'Не проголосовал'}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </main>
  );
}

