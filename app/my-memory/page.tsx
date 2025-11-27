'use client';

import { useEffect, useState, useMemo, memo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/Skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import CustomSelect from '@/components/ui/CustomSelect';
import SaveProgress from '@/components/SaveProgress';
import { getEffects, type EffectResult } from '@/app/actions/effects';

// Dynamic import только для DonutChart
const DonutChart = dynamic(() => import('@/components/DonutChart').then(mod => ({ default: mod.DonutChart })), {
  loading: () => <Skeleton className="w-[200px] h-[200px] rounded-full" variant="circular" />,
  ssr: false,
});

// Маппинг категорий
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

interface Vote {
  effectId: string; // Теперь string (cuid)
  variant: 'A' | 'B';
  timestamp: number;
}

interface Effect {
  id: string;
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

// Хелпер для парсинга вариантов из content
const parseVariantsFromContent = (content: string): { variantA: string; variantB: string } => {
  const lines = content.split('\n');
  const variantALine = lines.find(l => l.startsWith('Вариант А:'));
  const variantBLine = lines.find(l => l.startsWith('Вариант Б:'));
  return {
    variantA: variantALine?.replace('Вариант А: ', '').trim() || 'Вариант А',
    variantB: variantBLine?.replace('Вариант Б: ', '').trim() || 'Вариант Б',
  };
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
      // ID теперь может быть string (cuid) или number (старый формат)
      const effectId = key.replace('voted_effect_', '');
      const voteDataStr = localStorage.getItem(key);
      if (!voteDataStr || !effectId) continue;
      
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
  const [memoryProfileType, setMemoryProfileType] = useState<'typical' | 'unique' | 'special' | 'balanced'>('balanced');
  const [totalEffects, setTotalEffects] = useState<number>(0);
  const [effectsWithVotes, setEffectsWithVotes] = useState<EffectWithVote[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'majority' | 'minority'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'controversy'>('date');
  const effectsListRef = useRef<HTMLDivElement>(null);

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

        // Загружаем все эффекты через Server Action
        const allEffectsRaw = await getEffects({ limit: 1000 });
        setTotalEffects(allEffectsRaw.length);
        
        // Преобразуем эффекты в нужный формат
        const effectsMap = new Map<string, Effect>();
        allEffectsRaw.forEach((effect) => {
          const { variantA, variantB } = parseVariantsFromContent(effect.content);
          const catInfo = categoryMap[effect.category] || { emoji: '❓', name: 'Другое' };
          const totalVotes = effect.votesFor + effect.votesAgainst;
          const percentA = totalVotes > 0 ? Math.round((effect.votesFor / totalVotes) * 100 * 10) / 10 : 50;
          const percentB = totalVotes > 0 ? Math.round((effect.votesAgainst / totalVotes) * 100 * 10) / 10 : 50;
          
          effectsMap.set(effect.id, {
            id: effect.id,
            category: effect.category,
            categoryEmoji: catInfo.emoji,
            categoryName: catInfo.name,
            title: effect.title,
            variantA,
            variantB,
            votesA: effect.votesFor,
            votesB: effect.votesAgainst,
            percentA,
            percentB,
            totalVotes,
          });
        });

        // ДЕДУПЛИКАЦИЯ: Оставляем только последний голос для каждого effectId
        const uniqueVotesMap = new Map<string, Vote>();
        for (const vote of userVotes) {
          const existing = uniqueVotesMap.get(vote.effectId);
          // Если голоса нет или новый голос свежее - заменяем
          if (!existing || vote.timestamp > existing.timestamp) {
            uniqueVotesMap.set(vote.effectId, vote);
          }
        }
        const uniqueVotes = Array.from(uniqueVotesMap.values());

        // Подсчитываем статистику и создаем список эффектов с голосами
        let withMajority = 0;
        let withMinority = 0;
        const effectsWithVotesData: EffectWithVote[] = [];

        for (const vote of uniqueVotes) {
          const effect = effectsMap.get(vote.effectId);
          if (!effect) continue;

          if (effect.totalVotes === 0) continue;

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
            userVariant: vote.variant,
            isInMajority,
            voteTimestamp: vote.timestamp,
          });
        }

        const totalVotesCount = effectsWithVotesData.length;
        // Защита: totalVotes не может быть больше totalEffects
        const safeTotalVotes = Math.min(totalVotesCount, allEffectsRaw.length);
        const majorityPercent = safeTotalVotes > 0 ? Math.round((withMajority / safeTotalVotes) * 100) : 0;
        const minorityPercent = safeTotalVotes > 0 ? Math.round((withMinority / safeTotalVotes) * 100) : 0;

        setStats({
          totalVotes: safeTotalVotes,
          withMajority,
          withMinority,
          majorityPercent,
          minorityPercent,
        });

        // Определяем профиль памяти
        let profile = '';
        let profileType: 'typical' | 'unique' | 'special' | 'balanced' = 'balanced';
        if (majorityPercent > 60) {
          profile = 'Ты часто в большинстве';
          profileType = 'typical';
        } else if (majorityPercent < 40) {
          profile = 'У тебя уникальная память';
          profileType = 'unique';
        } else if (majorityPercent >= 50 && majorityPercent <= 60) {
          profile = 'Твоя память особенная';
          profileType = 'special';
        } else {
          profile = 'Твоя память сбалансирована';
          profileType = 'balanced';
        }
        setMemoryProfile(profile);
        setMemoryProfileType(profileType);
        // Сохраняем только уникальные голоса
        setVotes(uniqueVotes);
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


  const handleFilterChange = (filter: 'all' | 'majority' | 'minority') => {
    setActiveFilter(filter);
    
    // Даём время на анимацию смены контента
    setTimeout(() => {
      if (effectsListRef.current) {
        const element = effectsListRef.current;
        const headerOffset = 120; // Отступ от header
        
        // Получаем позицию элемента относительно viewport
        const elementRect = element.getBoundingClientRect();
        const elementTop = elementRect.top;
        
        // Проверяем: элемент ВЫШЕ начала viewport (скрыт сверху)?
        if (elementTop < headerOffset) {
          // Скроллим К элементу (он выше нас)
          const scrollPosition = window.scrollY + elementTop - headerOffset;
          window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
        }
        // Если элемент ниже или в viewport - НЕ скроллим!
      }
    }, 350); // Увеличили задержку для полной анимации
  };

  if (loading) {
    return (
      <main id="main-content" className="min-h-screen bg-dark py-16 px-4" role="main">
        <div className="max-w-4xl mx-auto">
          <Loading text="Загружаем твою статистику..." size="lg" />
          
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
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-12 text-center text-light"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Моя память
          </motion.h1>

          {/* Пустое состояние */}
          <div className="bg-darkCard p-12 rounded-2xl">
            <EmptyState
              icon="🧠"
              title="Ты ещё не проголосовал"
              description="Начни исследовать эффекты, чтобы увидеть свою карту памяти и узнать, насколько твои воспоминания совпадают с другими!"
              actionLabel="Начать исследование"
              actionHref="/catalog"
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-dark py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-light">
          Моя память
        </h1>

        {/* Статистика */}
        {stats && (() => {
          // Подготовка данных для PieChart
          const pieData = [
            { name: 'Большинство', value: stats.withMajority, color: '#3B82F6' },  // Синий
            { name: 'Меньшинство', value: stats.withMinority, color: '#F97316' },  // Оранжевый
          ];

          // Вычисляем уникальную память (<30%)
          let uniqueMemory = 0;
          effectsWithVotes.forEach((effect) => {
            const userPercent = effect.userVariant === 'A' ? effect.percentA : effect.percentB;
            if (userPercent < 30) {
              uniqueMemory++;
            }
          });

          // Получаем иконку и текст профиля
          const profileIcon = 
            memoryProfileType === 'typical' ? '👥' :
            memoryProfileType === 'unique' ? '✨' :
            memoryProfileType === 'special' ? '🌟' :
            '⚖️';
          const profileText = memoryProfile;

          return (
            <motion.section 
              className="py-12 px-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="max-w-6xl mx-auto bg-darkCard rounded-2xl p-6 border border-light/10">
                {/* Заголовок */}
                <motion.div 
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-4xl font-bold text-light mb-2">
                    Твоя статистика
                  </h2>
                  <p className="text-light/60">
                    Проголосовано: <span className="text-primary font-semibold">{stats.totalVotes}</span> из <span className="font-semibold">{totalEffects}</span> эффектов
                  </p>
                </motion.div>

                {/* Основная сетка */}
                <div className="grid lg:grid-cols-3 gap-8 items-start">
                  
                  {/* ЛЕВАЯ КОЛОНКА: Профиль памяти */}
                  <motion.div 
                    className="lg:col-span-1"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="bg-dark p-6 rounded-xl border border-light/10 h-full transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 group">
                      <div className="flex items-center gap-3 mb-4">
                        <motion.span 
                          className="text-3xl transition-transform duration-300 group-hover:scale-110 inline-block"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.4, type: 'spring', stiffness: 200 }}
                        >
                          {profileIcon}
                        </motion.span>
                        <h3 className="text-2xl font-bold text-light">
                          Профиль памяти
                        </h3>
                      </div>
                      
                      <div className="mb-6">
                        <p className="text-xl text-light font-semibold mb-2">
                          {profileText}
                        </p>
                      </div>

                      {/* Объяснение */}
                      <div className="p-4 bg-darkCard/50 rounded-lg border border-light/5">
                        <p className="text-light/70 text-sm mb-2">
                          <strong className="text-light/90">Что это значит?</strong>
                        </p>
                        <p className="text-light/60 text-sm leading-relaxed">
                          {memoryProfileType === 'unique' && 
                            'Ты помнишь многие вещи иначе чем большинство людей. Это не хорошо и не плохо - просто особенность твоей памяти. Возможно, ты видел другие версии или обращаешь внимание на детали.'
                          }
                          {memoryProfileType === 'typical' && 
                            'Твои воспоминания совпадают с большинством людей. У вас схожие культурные отсылки и опыт.'
                          }
                          {memoryProfileType === 'special' && 
                            'Твоя память особенная - иногда совпадает с большинством, иногда нет. Это говорит о разнообразном опыте.'
                          }
                          {memoryProfileType === 'balanced' && 
                            'У тебя сбалансированная память - примерно поровну голосуешь с большинством и меньшинством.'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Сохранение прогресса */}
                    <div className="mt-4">
                      <SaveProgress votesCount={stats.totalVotes} />
                    </div>
                  </motion.div>

                  {/* ЦЕНТРАЛЬНАЯ КОЛОНКА: Круговая диаграмма */}
                  <motion.div 
                    className="lg:col-span-1 flex flex-col items-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <div className="bg-dark p-8 rounded-xl border border-light/10 w-full transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/20 hover:-translate-y-1 group">
                      <h3 className="text-xl font-bold text-light text-center mb-6">
                        Распределение голосов
                      </h3>
                      
                      {/* Диаграмма */}
                      <div className="flex justify-center mb-6 relative group/chart">
                        <div className="transition-transform duration-500 group-hover/chart:scale-105">
                          <ResponsiveContainer width={280} height={280}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={85}
                                outerRadius={125}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                              >
                                <Cell fill="#3B82F6" stroke="none" />
                                <Cell fill="#F97316" stroke="none" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {/* Процент в центре (поверх диаграммы) - ИСПРАВЛЕНО */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className={`text-5xl font-bold mb-1 transition-all duration-300 group-hover/chart:scale-110 group-hover/chart:animate-pulse ${
                            stats.majorityPercent >= stats.minorityPercent 
                              ? 'text-blue-400' 
                              : 'text-orange-400'
                          }`}>
                            {Math.max(stats.majorityPercent, stats.minorityPercent).toFixed(0)}%
                          </p>
                          <p className="text-light/60 text-sm">
                            {stats.majorityPercent >= stats.minorityPercent ? 'большинство' : 'меньшинство'}
                          </p>
                        </div>
                      </div>

                      {/* Легенда */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 transition-all duration-300 hover:bg-blue-500/20 hover:border-blue-500/40 hover:shadow-md hover:shadow-blue-500/20 cursor-pointer group/legend">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-blue-500 transition-transform duration-300 group-hover/legend:scale-125"></div>
                            <span className="text-light font-medium">С большинством</span>
                          </div>
                          <span className="text-light font-bold transition-all duration-300 group-hover/legend:text-blue-300 group-hover/legend:scale-110 inline-block">
                            {stats.withMajority} <span className="text-light/60 text-sm">({stats.majorityPercent.toFixed(0)}%)</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/20 transition-all duration-300 hover:bg-orange-500/20 hover:border-orange-500/40 hover:shadow-md hover:shadow-orange-500/20 cursor-pointer group/legend">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-orange-500 transition-transform duration-300 group-hover/legend:scale-125"></div>
                            <span className="text-light font-medium">С меньшинством</span>
                          </div>
                          <span className="text-light font-bold transition-all duration-300 group-hover/legend:text-orange-300 group-hover/legend:scale-110 inline-block">
                            {stats.withMinority} <span className="text-light/60 text-sm">({stats.minorityPercent.toFixed(0)}%)</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* ПРАВАЯ КОЛОНКА: Детальная статистика */}
                  <motion.div 
                    className="lg:col-span-1"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <div className="bg-dark p-6 rounded-xl border border-light/10 h-full transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1 group">
                      <div className="flex items-center gap-3 mb-6">
                        <motion.span 
                          className="text-3xl transition-transform duration-300 group-hover:scale-110 inline-block"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.6, type: 'spring', stiffness: 200 }}
                        >
                          📊
                        </motion.span>
                        <h3 className="text-2xl font-bold text-light">
                          Детали
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {/* Всего проголосовано */}
                        <motion.div 
                          className="p-4 bg-darkCard/50 rounded-lg border border-light/5 transition-all duration-300 hover:bg-darkCard hover:border-light/20 hover:shadow-md hover:-translate-y-0.5 group/progress"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-light/70 text-sm">Всего ответов</span>
                            <span className="text-2xl font-bold text-primary transition-all duration-300 group-hover/progress:scale-110 inline-block">{stats.totalVotes}</span>
                          </div>
                          <div className="w-full bg-dark h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 group-hover/progress:shadow-lg group-hover/progress:shadow-primary/50"
                              style={{ width: `${totalEffects > 0 ? (stats.totalVotes / totalEffects) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <p className="text-light/50 text-xs mt-2">
                            из {totalEffects} эффектов ({totalEffects > 0 ? ((stats.totalVotes / totalEffects) * 100).toFixed(0) : 0}%)
                          </p>
                        </motion.div>

                        {/* Большинство */}
                        <motion.div 
                          className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 transition-all duration-300 hover:bg-blue-500/20 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 cursor-pointer group/detail"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl transition-transform duration-300 group-hover/detail:scale-125 inline-block">👥</span>
                              <span className="text-light/90 font-medium">Большинство</span>
                            </div>
                            <span className="text-3xl font-bold text-blue-400 transition-all duration-300 group-hover/detail:text-blue-300 group-hover/detail:scale-110 inline-block">{stats.withMajority}</span>
                          </div>
                          <p className="text-light/60 text-sm">
                            Твой выбор совпал с большинством
                          </p>
                        </motion.div>

                        {/* Меньшинство */}
                        <motion.div 
                          className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20 transition-all duration-300 hover:bg-orange-500/20 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/20 hover:-translate-y-0.5 cursor-pointer group/detail"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.7 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl transition-transform duration-300 group-hover/detail:scale-125 inline-block">✨</span>
                              <span className="text-light/90 font-medium">Меньшинство</span>
                            </div>
                            <span className="text-3xl font-bold text-orange-400 transition-all duration-300 group-hover/detail:text-orange-300 group-hover/detail:scale-110 inline-block">{stats.withMinority}</span>
                          </div>
                          <p className="text-light/60 text-sm">
                            Ты помнишь иначе чем большинство
                          </p>
                        </motion.div>

                        {/* Уникальная память */}
                        {uniqueMemory > 0 && (
                          <motion.div 
                            className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20 transition-all duration-300 hover:bg-purple-500/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 cursor-pointer group/detail"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.8 }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl transition-transform duration-300 group-hover/detail:scale-125 inline-block">🦄</span>
                                <span className="text-light/90 font-medium">Уникальная память</span>
                              </div>
                              <span className="text-3xl font-bold text-purple-400 transition-all duration-300 group-hover/detail:text-purple-300 group-hover/detail:scale-110 inline-block">{uniqueMemory}</span>
                            </div>
                            <p className="text-light/60 text-sm">
                              Очень редкие воспоминания (&lt;30%)
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.section>
          );
        })()}

        {/* Фильтры и сортировка */}
        <motion.div 
          className="bg-darkCard p-6 rounded-xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Табы фильтров */}
            <div className="flex gap-2">
              <motion.button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-primary text-light'
                    : 'bg-dark text-light/60 hover:text-light'
                }`}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                animate={{
                  scale: activeFilter === 'all' ? 1.05 : 1,
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                Все
              </motion.button>
              <motion.button
                onClick={() => handleFilterChange('majority')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeFilter === 'majority'
                    ? 'bg-primary text-light'
                    : 'bg-dark text-light/60 hover:text-light'
                }`}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                animate={{
                  scale: activeFilter === 'majority' ? 1.05 : 1,
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                С большинством
              </motion.button>
              <motion.button
                onClick={() => handleFilterChange('minority')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeFilter === 'minority'
                    ? 'bg-secondary text-light'
                    : 'bg-dark text-light/60 hover:text-light'
                }`}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                animate={{
                  scale: activeFilter === 'minority' ? 1.05 : 1,
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                С меньшинством
              </motion.button>
            </div>

            {/* Сортировка */}
            <div className="w-56">
              <CustomSelect
                value={sortBy}
                onChange={(val) => setSortBy(val as 'date' | 'name' | 'controversy')}
                options={[
                  { value: 'date', label: 'По дате голосования', emoji: '📅' },
                  { value: 'name', label: 'По названию', emoji: '🔤' },
                  { value: 'controversy', label: 'По спорности', emoji: '⚖️' },
                ]}
                placeholder="Сортировка"
              />
            </div>
          </div>
        </motion.div>

        {/* Список эффектов */}
        <div ref={effectsListRef}>
          <EffectsList
            effects={effectsWithVotes}
            activeFilter={activeFilter}
            sortBy={sortBy}
          />
        </div>
      </div>
    </main>
  );
}

// Компонент списка эффектов
const EffectsList = memo(({
  effects,
  activeFilter,
  sortBy,
}: {
  effects: EffectWithVote[];
  activeFilter: 'all' | 'majority' | 'minority';
  sortBy: 'date' | 'name' | 'controversy';
}) => {
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
      <div className="bg-darkCard p-12 rounded-xl">
        <EmptyState
          icon="🔍"
          title="Ничего не найдено"
          description="Попробуй изменить фильтры или выбрать другую сортировку"
        />
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      layout
      initial={false}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {filteredAndSorted.map((effect, index) => (
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
              y: -20,
              transition: {
                duration: 0.2,
                ease: 'easeIn',
              }
            }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          >
            <EffectCard effect={effect} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
});

EffectsList.displayName = 'EffectsList';

// Компонент карточки эффекта (мемоизирован для производительности)
const EffectCard = memo(({ effect }: { effect: EffectWithVote }) => {
  // Правильная проверка: в большинстве ли пользователь
  const isInMajority =
    effect.userVariant === 'A'
      ? effect.percentA > effect.percentB
      : effect.percentB > effect.percentA;

  const relativeDate = formatRelativeTime(effect.voteTimestamp);

  // Определяем тип памяти для бейджа
  const userPercent = effect.userVariant === 'A' ? effect.percentA : effect.percentB;
  const memoryType = isInMajority
    ? { icon: '👥', label: 'Большинство', color: 'bg-primary/20 text-primary border border-primary/30' }
    : { icon: '✨', label: 'Меньшинство', color: 'bg-secondary/20 text-secondary border border-secondary/30' };

  return (
    <Link 
      href={`/effect/${effect.id}`}
      className="block group"
    >
      <div className="bg-darkCard hover:bg-darkCard/80 p-5 rounded-xl border border-light/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/20">
        {/* Шапка БЕЗ бейджа - больше места для названия */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-125 inline-block">{effect.categoryEmoji}</span>
          <h3 className="text-lg font-bold text-light group-hover:text-primary transition-colors line-clamp-2">
            {effect.title}
          </h3>
        </div>

        {/* Твой выбор */}
        <div className="mb-3">
          <p className="text-sm text-light/60">
            Твой выбор: <span className="text-light font-semibold">{effect.userVariant === 'A' ? effect.variantA : effect.variantB}</span>
          </p>
        </div>

        {/* Прогресс бары - выделяем выбранный вариант */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            {/* Вариант А - выделяем если выбран */}
            <div className={`flex-1 h-2 rounded-full overflow-hidden transition-all duration-300 ${
              effect.userVariant === 'A' 
                ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-dark' 
                : 'bg-dark'
            }`}>
              <div 
                className={`h-full transition-all duration-500 ${
                  effect.userVariant === 'A'
                    ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                    : 'bg-gradient-to-r from-blue-500/50 to-blue-600/50'
                }`}
                style={{ width: `${effect.percentA}%` }}
              />
            </div>
            
            {/* Вариант Б - выделяем если выбран */}
            <div className={`flex-1 h-2 rounded-full overflow-hidden transition-all duration-300 ${
              effect.userVariant === 'B' 
                ? 'ring-2 ring-orange-500 ring-offset-4 ring-offset-dark' 
                : 'bg-dark'
            }`}>
              <div 
                className={`h-full transition-all duration-500 ${
                  effect.userVariant === 'B'
                    ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                    : 'bg-gradient-to-r from-orange-500/50 to-orange-600/50'
                }`}
                style={{ width: `${effect.percentB}%` }}
              />
            </div>
          </div>
          
          {/* Проценты */}
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${
              effect.userVariant === 'A' ? 'text-blue-400 font-bold' : 'text-blue-400/60'
            }`}>
              {effect.percentA.toFixed(1)}% <span className="text-light/40">({effect.votesA})</span>
            </span>
            <span className={`font-medium ${
              effect.userVariant === 'B' ? 'text-orange-400 font-bold' : 'text-orange-400/60'
            }`}>
              {effect.percentB.toFixed(1)}% <span className="text-light/40">({effect.votesB})</span>
            </span>
          </div>
        </div>

        {/* Футер с бейджем и стрелкой */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-light/5">
          <div className="flex items-center gap-2">
            <p className="text-xs text-light/40">
              {relativeDate}
            </p>
            {memoryType && (
              <div className={`px-2 py-0.5 rounded text-xs font-medium transition-all duration-300 group-hover:scale-105 ${memoryType.color}`}>
                {memoryType.icon} {memoryType.label}
              </div>
            )}
          </div>
          {/* Более заметная стрелка */}
          <div className="flex items-center gap-1 text-primary group-hover:gap-2 transition-all">
            <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Открыть
            </span>
            <span className="text-lg font-bold">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
});

EffectCard.displayName = 'EffectCard';

