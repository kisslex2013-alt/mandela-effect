'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/Skeleton';

interface Effect {
  id: number;
  category: string;
  categoryEmoji: string;
  categoryName: string;
  title: string;
  question: string;
  variantA: string;
  variantB: string;
  votesA: number;
  votesB: number;
  dateAdded: string;
}

interface Category {
  category: string;
  emoji: string;
  name: string;
  count: number;
}

type SortOption = 'popularity' | 'controversy' | 'newest' | 'alphabetical';

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');
  
  const [allEffects, setAllEffects] = useState<Effect[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [onlyUnvoted, setOnlyUnvoted] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [effectsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/effects'),
          fetch('/api/categories'),
        ]);

        if (effectsResponse.ok) {
          const effectsData = await effectsResponse.json();
          setAllEffects(effectsData);
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Получение проголосованных эффектов из localStorage
  const getVotedEffectIds = (): number[] => {
    if (typeof window === 'undefined') return [];
    const votedIds: number[] = [];
    // Проверяем все ключи вида voted_effect_${id}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('voted_effect_')) {
        const id = parseInt(key.replace('voted_effect_', ''));
        if (!isNaN(id)) {
          votedIds.push(id);
        }
      }
    }
    return votedIds;
  };

  // Фильтрация и сортировка
  const filteredAndSortedEffects = useMemo(() => {
    let filtered = [...allEffects];

    // Поиск
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (effect) =>
          effect.title.toLowerCase().includes(query) ||
          effect.question.toLowerCase().includes(query)
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
      const votedIds = getVotedEffectIds();
      filtered = filtered.filter((effect) => !votedIds.includes(effect.id));
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity': {
          const totalA = a.votesA + a.votesB;
          const totalB = b.votesA + b.votesB;
          return totalB - totalA;
        }
        case 'controversy': {
          const totalA = a.votesA + a.votesB;
          const totalB = b.votesA + b.votesB;
          if (totalA === 0 && totalB === 0) return 0;
          if (totalA === 0) return 1;
          if (totalB === 0) return -1;

          const percentA = (a.votesA / totalA) * 100;
          const percentB = (b.votesA / totalB) * 100;
          const diffA = Math.abs(50 - percentA);
          const diffB = Math.abs(50 - percentB);
          return diffA - diffB;
        }
        case 'newest':
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title, 'ru');
        default:
          return 0;
      }
    });

    return filtered;
  }, [allEffects, debouncedSearch, selectedCategories, sortBy, onlyUnvoted]);

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
      setSelectedCategories(categories.map((c) => c.category));
    }
  };

  const [votedEffectIds, setVotedEffectIds] = useState<number[]>([]);

  // Обновляем список проголосованных эффектов
  useEffect(() => {
    setVotedEffectIds(getVotedEffectIds());
    
    // Слушаем изменения localStorage
    const handleStorageChange = () => {
      setVotedEffectIds(getVotedEffectIds());
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Также слушаем события на этой же вкладке через кастомное событие
    window.addEventListener('voteUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('voteUpdated', handleStorageChange);
    };
  }, [onlyUnvoted, allEffects]);

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
    <main className="min-h-screen bg-dark py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center text-light">
          Каталог эффектов
        </h1>

        {/* Панель фильтров */}
        <div className="bg-darkCard rounded-xl p-6 mb-8 space-y-4">
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
                className="w-full px-4 py-3 bg-dark rounded-lg text-light text-left flex items-center justify-between hover:bg-dark/80 transition-colors"
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              >
                <span>
                  Категории{' '}
                  {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                </span>
                <span className={`transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
              <div
                id="categories-dropdown"
                className={`${isCategoriesOpen ? 'block' : 'hidden'} absolute top-full left-0 right-0 mt-2 bg-darkCard rounded-lg p-4 z-10 max-h-64 overflow-y-auto shadow-2xl`}
              >
                <label className="flex items-center gap-2 p-2 hover:bg-dark rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.length === categories.length}
                    onChange={handleSelectAllCategories}
                    className="w-4 h-4"
                  />
                  <span className="text-light">Все категории</span>
                </label>
                <div className="border-t border-dark my-2" />
                {categories.map((category) => (
                  <label
                    key={category.category}
                    className="flex items-center gap-2 p-2 hover:bg-dark rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.category)}
                      onChange={() => handleCategoryToggle(category.category)}
                      className="w-4 h-4"
                    />
                    <span className="text-light">
                      {category.emoji} {category.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Сортировка */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-4 py-3 bg-dark rounded-lg text-light focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="popularity">По популярности</option>
              <option value="controversy">По спорности</option>
              <option value="newest">По новизне</option>
              <option value="alphabetical">По алфавиту</option>
            </select>

            {/* Только не пройденные */}
            <label className="flex items-center gap-2 px-4 py-3 bg-dark rounded-lg cursor-pointer hover:bg-dark/80 transition-colors">
              <input
                type="checkbox"
                checked={onlyUnvoted}
                onChange={(e) => setOnlyUnvoted(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-light">Только не пройденные</span>
            </label>
          </div>
        </div>

        {/* Счётчик результатов */}
        <div className="mb-6 text-light/80">
          Показано {filteredAndSortedEffects.length} из {allEffects.length}{' '}
          {allEffects.length === 1 ? 'эффекта' : 'эффектов'}
        </div>

        {/* Сетка эффектов */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-darkCard rounded-xl p-6 flex flex-col">
                <Skeleton className="w-8 h-8 mb-4" variant="circular" />
                <Skeleton className="w-3/4 h-6 mb-3" variant="rectangular" />
                <Skeleton className="w-full h-4 mb-2" variant="text" />
                <Skeleton className="w-full h-4 mb-4" variant="text" />
                <Skeleton className="w-full h-2 mb-4" variant="rectangular" />
                <Skeleton className="w-1/2 h-4" variant="text" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedEffects.length === 0 ? (
          <div className="text-center text-light/60 py-12">
            <p className="text-lg">Ничего не найдено</p>
            <p className="text-sm mt-2">
              Попробуйте изменить фильтры или поисковый запрос
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedEffects.map((effect) => {
              const totalVotes = effect.votesA + effect.votesB;
              const percentA =
                totalVotes > 0 ? Math.round((effect.votesA / totalVotes) * 100) : 0;
              const percentB =
                totalVotes > 0 ? Math.round((effect.votesB / totalVotes) * 100) : 0;
              const hasVoted = votedEffectIds.includes(effect.id);
              const questionPreview =
                effect.question.length > 100
                  ? `${effect.question.substring(0, 100)}...`
                  : effect.question;

              return (
                <Link
                  key={effect.id}
                  href={`/effect/${effect.id}`}
                  className="group bg-darkCard rounded-xl p-6 hover:scale-105 hover:shadow-2xl transition-all duration-300 flex flex-col"
                >
                  {/* Категория */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{effect.categoryEmoji}</span>
                    <span className="text-sm text-light/60">
                      {effect.categoryName}
                    </span>
                  </div>

                  {/* Название */}
                  <h3 className="text-xl font-bold text-light mb-3 group-hover:text-primary transition-colors">
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
                      <div className="relative h-2 rounded-full bg-dark/50 overflow-hidden">
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
                    <span className="text-light/60">
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
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
