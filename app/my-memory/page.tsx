'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/Skeleton';

interface Vote {
  effectId: number;
  variant: 'A' | 'B';
  timestamp: number;
}

interface Effect {
  id: number;
  category: string;
  categoryEmoji: string;
  categoryName: string;
  title: string;
  variantA: string;
  variantB: string;
  votesA: number;
  votesB: number;
  percentA: number;
  percentB: number;
  totalVotes: number;
}

interface EffectWithVote extends Effect {
  userVariant: 'A' | 'B';
  isInMajority: boolean;
  voteTimestamp: number;
}

interface UserStats {
  totalVotes: number;
  withMajority: number;
  withMinority: number;
  majorityPercent: number;
  minorityPercent: number;
}

// Функция для миграции старых данных
const migrateOldVoteData = () => {
  if (typeof window === 'undefined') return;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('voted_effect_')) {
      const voteDataStr = localStorage.getItem(key);
      if (!voteDataStr) continue;
      
      try {
        // Пытаемся распарсить как JSON
        const voteData = JSON.parse(voteDataStr);
        
        // Если это уже новый формат с timestamp - пропускаем
        if (voteData.timestamp && voteData.variant) {
          continue;
        }
        
        // Если это старый формат объекта без timestamp - мигрируем
        if (voteData.variant && !voteData.timestamp) {
          const migratedData = {
            variant: voteData.variant,
            timestamp: Date.now(),
            effectTitle: voteData.effectTitle || '',
          };
          localStorage.setItem(key, JSON.stringify(migratedData));
        }
      } catch {
        // Если не JSON - это старый формат (просто строка 'A' или 'B')
        const variant = voteDataStr as 'A' | 'B';
        if (variant === 'A' || variant === 'B') {
          const migratedData = {
            variant,
            timestamp: Date.now(),
            effectTitle: '',
          };
          localStorage.setItem(key, JSON.stringify(migratedData));
        }
      }
    }
  }
};

// Функция форматирования относительного времени
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    if (days === 1) return 'вчера';
    if (days < 5) return `${days} дня назад`;
    return `${days} дней назад`;
  }
  if (hours > 0) {
    if (hours === 1) return 'час назад';
    if (hours < 5) return `${hours} часа назад`;
    return `${hours} часов назад`;
  }
  if (minutes > 0) {
    if (minutes === 1) return 'минуту назад';
    if (minutes < 5) return `${minutes} минуты назад`;
    return `${minutes} минут назад`;
  }
  return 'только что';
};

const getUserVotes = (): Vote[] => {
  if (typeof window === 'undefined') return [];
  
  // Мигрируем старые данные при первом вызове
  migrateOldVoteData();
  
  const votes: Vote[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('voted_effect_')) {
      const effectId = parseInt(key.replace('voted_effect_', ''));
      const voteDataStr = localStorage.getItem(key);
      if (!voteDataStr || isNaN(effectId)) continue;
      
      try {
        const voteData = JSON.parse(voteDataStr);
        
        // Обрабатываем новый формат
        if (voteData.variant && voteData.timestamp) {
          const variant = voteData.variant;
          const timestamp = voteData.timestamp;
          
          if ((variant === 'A' || variant === 'B') && typeof timestamp === 'number') {
            votes.push({ effectId, variant, timestamp });
          }
        }
      } catch {
        // Если не удалось распарсить - пропускаем
        continue;
      }
    }
  }
  return votes;
};

export default function MyMemoryPage() {
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [memoryProfile, setMemoryProfile] = useState<string>('');
  const [totalEffects, setTotalEffects] = useState<number>(0);
  const [effectsWithVotes, setEffectsWithVotes] = useState<EffectWithVote[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'majority' | 'minority'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'controversy'>('date');

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const userVotes = getUserVotes();

        if (userVotes.length === 0) {
          setStats(null);
          setVotes([]);
          setMemoryProfile('');
          setLoading(false);
          return;
        }

        // Загружаем все эффекты
        const effectsResponse = await fetch('/api/effects');
        if (!effectsResponse.ok) {
          console.error('Ошибка загрузки эффектов');
          setStats(null);
          setVotes([]);
          setMemoryProfile('');
          setLoading(false);
          return;
        }

        const allEffects: Effect[] = await effectsResponse.json();
        setTotalEffects(allEffects.length);
        
        const effectsMap = new Map<number, Effect>();
        allEffects.forEach((effect) => {
          effectsMap.set(effect.id, effect);
        });

        // Подсчитываем статистику и создаем список эффектов с голосами
        let withMajority = 0;
        let withMinority = 0;
        const effectsWithVotesData: EffectWithVote[] = [];

        for (const vote of userVotes) {
          const effect = effectsMap.get(vote.effectId);
          if (!effect) continue;

          const totalVotes = effect.votesA + effect.votesB;
          if (totalVotes === 0) continue;

          // Вычисляем проценты
          const percentA = totalVotes > 0 ? Math.round((effect.votesA / totalVotes) * 100 * 10) / 10 : 0;
          const percentB = totalVotes > 0 ? Math.round((effect.votesB / totalVotes) * 100 * 10) / 10 : 0;

          // Правильная проверка: в большинстве ли пользователь
          const isInMajority =
            vote.variant === 'A'
              ? effect.votesA > effect.votesB
              : effect.votesB > effect.votesA;

          if (isInMajority) {
            withMajority++;
          } else {
            withMinority++;
          }

          // Добавляем эффект с информацией о голосе
          effectsWithVotesData.push({
            ...effect,
            percentA,
            percentB,
            totalVotes,
            userVariant: vote.variant,
            isInMajority,
            voteTimestamp: vote.timestamp,
          });
        }

        const totalVotes = userVotes.length;
        const majorityPercent = totalVotes > 0 ? Math.round((withMajority / totalVotes) * 100) : 0;
        const minorityPercent = totalVotes > 0 ? Math.round((withMinority / totalVotes) * 100) : 0;

        setStats({
          totalVotes,
          withMajority,
          withMinority,
          majorityPercent,
          minorityPercent,
        });

        // Определяем профиль памяти
        let profile = '';
        if (majorityPercent > 60) {
          profile = 'Ты часто в большинстве 👥';
        } else if (majorityPercent < 40) {
          profile = 'У тебя уникальная память ✨';
        } else {
          profile = 'Твоя память сбалансирована ⚖️';
        }
        setMemoryProfile(profile);
        setVotes(userVotes);
        setEffectsWithVotes(effectsWithVotesData);
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Слушаем изменения localStorage
    const handleStorageChange = () => {
      loadStats();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('voteUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('voteUpdated', handleStorageChange);
    };
  }, []);

  // Круговая диаграмма (donut chart)
  const DonutChart = ({ majorityPercent, minorityPercent }: { majorityPercent: number; minorityPercent: number }) => {
    const size = 200;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    // Длина дуги для большинства (синий)
    const majorityLength = (majorityPercent / 100) * circumference;
    // Длина дуги для меньшинства (оранжевый)
    const minorityLength = (minorityPercent / 100) * circumference;
    // Смещение для меньшинства (начинается после большинства)
    const minorityOffset = circumference - majorityLength;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Фоновый круг */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth={strokeWidth}
          />
          {/* Синий сегмент (большинство) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            strokeDasharray={`${majorityLength} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          {/* Оранжевый сегмент (меньшинство) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${minorityLength} ${circumference}`}
            strokeDashoffset={minorityOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Процент в центре */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-light">{majorityPercent}%</div>
            <div className="text-sm text-light/60">с большинством</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-dark py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="w-48 h-12 mx-auto mb-12" variant="rectangular" />
          
          {/* Скелетон статистики */}
          <div className="bg-darkCard p-12 rounded-2xl mb-8">
            <Skeleton className="w-64 h-6 mx-auto mb-8" variant="text" />
            
            {/* Скелетон круговой диаграммы */}
            <div className="flex justify-center mb-8">
              <Skeleton className="w-48 h-48" variant="circular" />
            </div>
            
            {/* Скелетоны легенды */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Skeleton className="w-48 h-6" variant="text" />
              <Skeleton className="w-48 h-6" variant="text" />
            </div>
          </div>

          {/* Скелетон профиля памяти */}
          <div className="bg-darkCard p-8 rounded-2xl text-center mb-8">
            <Skeleton className="w-32 h-6 mx-auto mb-2" variant="text" />
            <Skeleton className="w-48 h-6 mx-auto" variant="text" />
          </div>

          {/* Скелетоны фильтров */}
          <div className="bg-darkCard p-6 rounded-xl mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-2">
                <Skeleton className="w-20 h-10" variant="rectangular" />
                <Skeleton className="w-32 h-10" variant="rectangular" />
                <Skeleton className="w-32 h-10" variant="rectangular" />
              </div>
              <Skeleton className="w-48 h-10" variant="rectangular" />
            </div>
          </div>

          {/* Скелетоны карточек эффектов */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-darkCard p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="w-8 h-8" variant="circular" />
                  <Skeleton className="w-3/4 h-6" variant="rectangular" />
                </div>
                <Skeleton className="w-full h-4 mb-2" variant="text" />
                <Skeleton className="w-2/3 h-4 mb-4" variant="text" />
                <Skeleton className="w-full h-6 mb-2" variant="rectangular" />
                <Skeleton className="w-1/2 h-4" variant="text" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Пустое состояние - показываем если нет голосов
  if (!loading && votes.length === 0) {
    return (
      <main className="min-h-screen bg-dark py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-light">
            Моя память
          </h1>

          {/* Пустое состояние */}
          <div className="bg-darkCard p-12 rounded-2xl text-center">
            <div className="text-8xl mb-6">🧠</div>
            <h2 className="text-3xl font-bold text-light mb-4">
              Ты ещё не проголосовал
            </h2>
            <p className="text-lg text-light/80 mb-8 max-w-md mx-auto">
              Начни исследовать эффекты, чтобы увидеть свою карту памяти
            </p>
            <Link
              href="/catalog"
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary to-secondary text-light font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Начать исследование
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-dark py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-light">
          Моя память
        </h1>

        {/* Общая статистика */}
        {stats && (
          <div className="bg-darkCard p-12 rounded-2xl mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-light mb-2">
                Твои ответы: {stats.totalVotes} из {totalEffects} эффектов
              </h2>
            </div>

            {/* Круговая диаграмма */}
            <div className="flex justify-center mb-8">
              <DonutChart 
                majorityPercent={stats.majorityPercent} 
                minorityPercent={stats.minorityPercent} 
              />
            </div>

            {/* Легенда */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-lg">
              <div className="flex items-center gap-3">
                <span className="text-primary text-xl">●</span>
                <span className="text-light">
                  С большинством: {stats.withMajority} ({stats.majorityPercent}%)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-secondary text-xl">●</span>
                <span className="text-light">
                  С меньшинством: {stats.withMinority} ({stats.minorityPercent}%)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Профиль памяти */}
        <div className="bg-darkCard p-8 rounded-2xl text-center mb-8">
          <h3 className="text-2xl font-bold text-light mb-2">Профиль памяти</h3>
          <p className="text-xl text-light/90">{memoryProfile}</p>
        </div>

        {/* Фильтры и сортировка */}
        <div className="bg-darkCard p-6 rounded-xl mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Табы фильтров */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-primary text-light'
                    : 'bg-dark text-light/60 hover:text-light'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setActiveFilter('majority')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeFilter === 'majority'
                    ? 'bg-primary text-light'
                    : 'bg-dark text-light/60 hover:text-light'
                }`}
              >
                С большинством
              </button>
              <button
                onClick={() => setActiveFilter('minority')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeFilter === 'minority'
                    ? 'bg-secondary text-light'
                    : 'bg-dark text-light/60 hover:text-light'
                }`}
              >
                С меньшинством
              </button>
            </div>

            {/* Сортировка */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'controversy')}
                className="px-4 py-2 bg-dark rounded-lg text-light border border-darkCard focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8"
              >
                <option value="date">По дате голосования</option>
                <option value="name">По названию</option>
                <option value="controversy">По спорности</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="text-light/60">▼</span>
              </div>
            </div>
          </div>
        </div>

        {/* Список эффектов */}
        <EffectsList
          effects={effectsWithVotes}
          activeFilter={activeFilter}
          sortBy={sortBy}
        />
      </div>
    </main>
  );
}

// Компонент списка эффектов
function EffectsList({
  effects,
  activeFilter,
  sortBy,
}: {
  effects: EffectWithVote[];
  activeFilter: 'all' | 'majority' | 'minority';
  sortBy: 'date' | 'name' | 'controversy';
}) {
  const filteredAndSorted = useMemo(() => {
    let filtered = effects;

    // Фильтрация
    if (activeFilter === 'majority') {
      filtered = filtered.filter((e) => e.isInMajority);
    } else if (activeFilter === 'minority') {
      filtered = filtered.filter((e) => !e.isInMajority);
    }

    // Сортировка
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return b.voteTimestamp - a.voteTimestamp; // Новые первые
      } else if (sortBy === 'name') {
        return a.title.localeCompare(b.title, 'ru');
      } else {
        // По спорности (близость к 50/50)
        const controversyA = Math.abs(a.percentA - 50);
        const controversyB = Math.abs(b.percentA - 50);
        return controversyA - controversyB;
      }
    });

    return sorted;
  }, [effects, activeFilter, sortBy]);

  if (filteredAndSorted.length === 0) {
    return (
      <div className="bg-darkCard p-12 rounded-xl text-center">
        <p className="text-lg text-light/60">Нет эффектов с этим фильтром</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {filteredAndSorted.map((effect) => (
        <EffectCard key={effect.id} effect={effect} />
      ))}
    </div>
  );
}

// Компонент карточки эффекта
function EffectCard({ effect }: { effect: EffectWithVote }) {
  const userPercent = effect.userVariant === 'A' ? effect.percentA : effect.percentB;
  const otherPercent = effect.userVariant === 'A' ? effect.percentB : effect.percentA;
  const userVotes = effect.userVariant === 'A' ? effect.votesA : effect.votesB;
  const otherVotes = effect.userVariant === 'A' ? effect.votesB : effect.votesA;

  // Позиция маркера "Ты здесь" - в середине выбранной секции прогресс-бара
  // Если выбран A → в середине синей части (слева)
  // Если выбран B → в середине оранжевой части (справа)
  const markerPosition =
    effect.userVariant === 'A'
      ? effect.percentA / 2 // В середине синей части
      : effect.percentA + effect.percentB / 2; // В середине оранжевой части
  
  // Ограничиваем позицию маркера в пределах прогресс-бара
  const clampedMarkerPosition = Math.max(2, Math.min(98, markerPosition));

  // Правильная проверка: в большинстве ли пользователь
  const isInMajority =
    effect.userVariant === 'A'
      ? effect.percentA > effect.percentB
      : effect.percentB > effect.percentA;

  const relativeDate = formatRelativeTime(effect.voteTimestamp);

  return (
    <Link
      href={`/effect/${effect.id}`}
      className={`bg-darkCard p-6 rounded-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 ${
        isInMajority
          ? 'border-l-4 border-primary'
          : 'border-l-4 border-secondary'
      }`}
    >
      {/* Категория и название */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{effect.categoryEmoji}</span>
        <h3 className="text-lg font-bold text-light">{effect.title}</h3>
      </div>

      {/* Твой выбор */}
      <div className="mb-4">
        <p className="text-sm text-light/60 mb-1">Твой выбор: Вариант {effect.userVariant}</p>
        <p className="text-light/90">
          {effect.userVariant === 'A' ? effect.variantA : effect.variantB}
        </p>
      </div>

      {/* Распределение */}
      <div className="mb-4">
        <p className="text-sm text-light/60 mb-2">Распределение:</p>
        <div className="relative h-6 bg-dark rounded-full overflow-visible mb-6">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(to right, #3b82f6 ${effect.percentA}%, #f59e0b ${effect.percentA}%)`,
            }}
          />
          {/* Маркер "Ты здесь" */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-light z-10"
            style={{
              left: `${clampedMarkerPosition}%`,
              transform: 'translateX(-50%) translateY(-50%)',
            }}
          />
          <div
            className="absolute text-xs text-light/80 whitespace-nowrap"
            style={{
              left: `${clampedMarkerPosition}%`,
              transform: 'translateX(-50%)',
              top: '100%',
              marginTop: '4px',
            }}
          >
            ↑ Ты здесь
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-primary font-semibold">{effect.percentA}%</span>
          <span className="text-secondary font-semibold">{effect.percentB}%</span>
        </div>
        <div className="flex justify-between items-center text-xs text-light/40 mt-1">
          <span>{effect.votesA.toLocaleString('ru-RU')} голосов</span>
          <span>{effect.votesB.toLocaleString('ru-RU')} голосов</span>
        </div>
      </div>

      {/* Бейдж */}
      <div className="mb-4">
        {isInMajority ? (
          <span className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
            В большинстве 👥
          </span>
        ) : (
          <span className="inline-block px-3 py-1 bg-secondary/20 text-secondary rounded-full text-sm font-semibold">
            В меньшинстве ✨
          </span>
        )}
      </div>

      {/* Дата */}
      <p className="text-sm text-light/60 mb-4">
        Проголосовано: {relativeDate}
      </p>

      {/* Кнопка */}
      <div className="flex items-center justify-end text-primary font-semibold text-sm">
        Посмотреть эффект →
      </div>
    </Link>
  );
}

