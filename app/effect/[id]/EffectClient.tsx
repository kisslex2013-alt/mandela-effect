'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import AccordionButton from '@/components/AccordionButton';
import { saveVote, getUserVote, migrateLocalVotes } from '@/app/actions/votes';
import { getVisitorId, getLocalVotes, clearLocalVotes, saveLocalVote, needsMigration } from '@/lib/visitor';
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

// Маппинг источников на URL (для старых данных с названиями вместо URL)
const getSourceUrl = (source: string): string => {
  const sourceMap: Record<string, string> = {
    'Simply Psychology': 'https://www.simplypsychology.org/false-memory.html',
    'Psychology Today': 'https://www.psychologytoday.com/us/basics/memory',
    'Medical News Today': 'https://www.medicalnewstoday.com/articles/326582',
    'Brain Bridge Lab (UChicago)': 'https://bridge.uchicago.edu/news/pikachus-tail-how-false-memories-are-generated',
    'Cognitive Psychology Review': 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4183265/',
    'Journal of Memory and Language': 'https://www.journals.elsevier.com/journal-of-memory-and-language',
    'Memory & Cognition Journal': 'https://link.springer.com/journal/13421',
    'r/MandelaEffect': 'https://www.reddit.com/r/MandelaEffect/',
    'r/Retconned': 'https://www.reddit.com/r/Retconned/',
  };
  return sourceMap[source] || getSafeUrl(source);
};

// Вспомогательная функция для безопасного URL (добавляет https:// если нет протокола)
const getSafeUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

// Вспомогательная функция для красивого отображения домена
const getCleanLinkText = (url: string): string => {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
};

interface Interpretations {
  scientific?: string;
  scientificTheory?: string;
  scientificSource?: string;
  community?: string;
  communitySource?: string;
}

interface EffectClientProps {
  effect: EffectResult;
  allEffects: EffectResult[];
}

// Функция для преобразования URL в кликабельные ссылки
function renderTextWithLinks(text: string): React.ReactNode {
  // Регулярное выражение для поиска URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 hover:underline transition-colors break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function EffectClient({ effect: initialEffect, allEffects }: EffectClientProps) {
  const router = useRouter();
  const [effect, setEffect] = useState(initialEffect);
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B' | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isCheckingVote, setIsCheckingVote] = useState(true); // Состояние проверки голоса
  const [showCurrentState, setShowCurrentState] = useState(false);
  const [showResidue, setShowResidue] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showInterpretations, setShowInterpretations] = useState(false);

  // Вычисляем проценты
  const totalVotes = effect.votesFor + effect.votesAgainst;
  const percentA = totalVotes > 0 ? (effect.votesFor / totalVotes) * 100 : 50;
  const percentB = totalVotes > 0 ? (effect.votesAgainst / totalVotes) * 100 : 50;

  // Получаем информацию о категории
  const catInfo = categoryMap[effect.category] || { emoji: '❓', name: effect.category };

  // Принудительно кастим к any, чтобы проверить наличие данных
  const rawInterpretations = effect.interpretations as any;
  
  // Проверяем, есть ли там хоть что-то
  const hasInterpretations = rawInterpretations && (
    (rawInterpretations.scientific && rawInterpretations.scientific.length > 0) || 
    (rawInterpretations.community && rawInterpretations.community.length > 0)
  );

  // Парсим варианты из content
  const contentLines = effect.content.split('\n');
  const variantA = contentLines[0]?.replace('Вариант А: ', '') || 'Вариант А';
  const variantB = contentLines[1]?.replace('Вариант Б: ', '') || 'Вариант Б';
  
  // Текущее состояние из content
  const currentStateLine = contentLines.find(line => line.includes('Текущее состояние:'));
  const currentState = currentStateLine?.replace('Текущее состояние: ', '').trim() || effect.residue;

  // Проверяем голос при загрузке (сначала сервер, потом localStorage как fallback)
  useEffect(() => {
    let isMounted = true;
    
    const checkVote = async () => {
      setIsCheckingVote(true); // Начинаем проверку
      
      // СНАЧАЛА проверяем localStorage (мгновенно, синхронно)
      const votedKey = `voted_effect_${effect.id}`;
      const votedStr = localStorage.getItem(votedKey);
      
      if (votedStr) {
        try {
          const voteData = JSON.parse(votedStr);
          const voted = typeof voteData === 'string' ? voteData : voteData.variant;
          if ((voted === 'A' || voted === 'B') && isMounted) {
            setSelectedVariant(voted);
            setHasVoted(true);
            setIsCheckingVote(false); // Быстрая проверка завершена
            // Параллельно проверяем сервер для синхронизации (не блокируем UI)
            const visitorId = getVisitorId();
            if (visitorId) {
              getUserVote(visitorId, effect.id).then((serverVote) => {
                if (isMounted && serverVote.variant && serverVote.variant !== voted) {
                  // Если на сервере другой голос - обновляем
                  setSelectedVariant(serverVote.variant as 'A' | 'B');
                }
              }).catch(() => {
                // Игнорируем ошибки сервера, используем localStorage
              });
            }
            return; // Выходим сразу, не ждем сервер
          }
        } catch {
          if ((votedStr === 'A' || votedStr === 'B') && isMounted) {
            setSelectedVariant(votedStr);
            setHasVoted(true);
            setIsCheckingVote(false);
            return;
          }
        }
      }
      
      // Если в localStorage нет - проверяем сервер
      const visitorId = getVisitorId();
      
      if (visitorId) {
        // Проверяем сервер с таймаутом (максимум 2 секунды)
        const serverCheckPromise = getUserVote(visitorId, effect.id);
        const timeoutPromise = new Promise<{ variant: null }>((resolve) => {
          setTimeout(() => resolve({ variant: null }), 2000);
        });
        
        const serverVote = await Promise.race([serverCheckPromise, timeoutPromise]);
        
        if (isMounted && serverVote.variant) {
          setSelectedVariant(serverVote.variant as 'A' | 'B');
          setHasVoted(true);
          setIsCheckingVote(false);
          return;
        }
        
        // Параллельно проверяем миграцию (не блокируем UI)
        if (needsMigration()) {
          const localVotes = getLocalVotes();
          if (localVotes.length > 0) {
            migrateLocalVotes(visitorId, localVotes).then((result) => {
              if (result.success && result.migrated > 0) {
                clearLocalVotes();
                toast.success(`✅ Мигрировано ${result.migrated} голосов на сервер!`);
              }
            }).catch(() => {
              // Игнорируем ошибки миграции
            });
          }
        }
      }
      
      if (isMounted) {
        setIsCheckingVote(false); // Проверка завершена
      }
    };
    
    checkVote();

    // Слушаем события обновления голосов (если голос был добавлен на другой странице)
    const handleVoteUpdate = () => {
      if (isMounted) {
        checkVote();
      }
    };
    window.addEventListener('voteUpdated', handleVoteUpdate);
    
    return () => {
      isMounted = false;
      window.removeEventListener('voteUpdated', handleVoteUpdate);
    };
  }, [effect.id]);

  // Навигация
  const currentIndex = allEffects.findIndex((e) => e.id === effect.id);
  const prevEffect = currentIndex > 0 ? allEffects[currentIndex - 1] : null;
  const nextEffect = currentIndex < allEffects.length - 1 ? allEffects[currentIndex + 1] : null;

  const handleVote = async (variant: 'A' | 'B') => {
    // Двойная проверка: и состояние, и проверка на сервере
    if (hasVoted || isVoting) {
      console.warn('[EffectClient] Попытка проголосовать повторно, hasVoted:', hasVoted, 'isVoting:', isVoting);
      return;
    }

    setIsVoting(true);

    try {
      const visitorId = getVisitorId();
      
      if (!visitorId) {
        toast.error('Не удалось идентифицировать пользователя');
        setIsVoting(false);
        return;
      }

      // Дополнительная проверка: проверяем, нет ли уже голоса на сервере
      const existingVote = await getUserVote(visitorId, effect.id);
      if (existingVote.variant) {
        console.warn('[EffectClient] Голос уже существует, блокируем повторное голосование');
        setSelectedVariant(existingVote.variant as 'A' | 'B');
        setHasVoted(true);
        setIsVoting(false);
        toast('Вы уже проголосовали за этот эффект', { icon: 'ℹ️' });
        return;
      }

      // Сохраняем голос на сервере
      const result = await saveVote({
        visitorId,
        effectId: effect.id,
        variant,
      });

      if (result.success && result.effect) {
        // Сохраняем локальный бэкап (для оффлайн режима и быстрой проверки)
        saveLocalVote(effect.id, variant, effect.title);

        // Отправляем событие для обновления каталога
        window.dispatchEvent(new Event('voteUpdated'));

        // Обновляем состояние
        setEffect({
          ...effect,
          votesFor: result.effect.votesFor,
          votesAgainst: result.effect.votesAgainst,
        });

        setSelectedVariant(variant);
        setHasVoted(true);

        // Конфетти
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: variant === 'A' ? ['#3b82f6'] : ['#f59e0b'],
        });

        toast.success('Голос учтён! ✓');
      } else {
        toast.error(result.error || 'Что-то пошло не так');
      }
    } catch (error) {
      console.error('Ошибка при голосовании:', error);
      toast.error('Что-то пошло не так. Попробуйте снова');
    } finally {
      setIsVoting(false);
    }
  };

  const handleRandomEffect = () => {
    const randomIndex = Math.floor(Math.random() * allEffects.length);
    const randomEffect = allEffects[randomIndex];
    if (randomEffect && randomEffect.id !== effect.id) {
      router.push(`/effect/${randomEffect.id}`);
    }
  };

  // Вычисляем статус пользователя относительно большинства
  const isInMajority = selectedVariant === 'A'
    ? effect.votesFor >= effect.votesAgainst
    : effect.votesAgainst >= effect.votesFor;
  
  const majorityPercent = Math.max(percentA, percentB);
  const userPercent = selectedVariant === 'A' ? percentA : percentB;

  return (
    <main id="main-content" className="min-h-screen bg-dark py-16 px-4" role="main">
      <div className="max-w-4xl mx-auto">
        {/* Хлебные крошки */}
        <nav className="mb-8 text-sm text-light/60">
          <Link href="/" className="hover:text-light transition-colors">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/catalog?category=${effect.category}`}
            className="hover:text-light transition-colors"
          >
            {catInfo.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-light">{effect.title}</span>
        </nav>

        {/* Заголовок */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{catInfo.emoji}</span>
            <span className="text-sm text-light/60">{catInfo.name}</span>
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold mb-6 text-center"
            style={{
              background: 'linear-gradient(to right, #3b82f6, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {effect.title}
          </h1>
        </div>

        {/* Вопрос */}
        <p className="text-2xl md:text-3xl font-semibold text-center mb-12 text-light">
          {effect.description}
        </p>

        {/* Варианты */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
          {/* Индикатор загрузки проверки голоса */}
          {isCheckingVote && (
            <div className="col-span-2 flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-light/60">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Проверка статуса голосования...</span>
              </div>
            </div>
          )}
          
          {/* Вариант A */}
          <motion.div
            whileHover={!hasVoted && !isCheckingVote ? { scale: 1.02 } : {}}
            className={`relative bg-darkCard p-8 rounded-xl transition-all duration-300 border-2 ${
              isCheckingVote
                ? 'opacity-50 pointer-events-none'
                : selectedVariant === 'A'
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                : hasVoted
                ? 'border-transparent opacity-80'
                : 'border-transparent hover:border-primary/50'
            }`}
          >
            {/* Галочка выбора */}
            {selectedVariant === 'A' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-3 -right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
            )}

            <h3 className="text-lg font-semibold text-light mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">А</span>
              Вариант А
            </h3>
            <p className="text-xl text-center text-light/90 mb-6 min-h-[60px] flex items-center justify-center">
              {variantA}
            </p>

            {!hasVoted ? (
              <motion.button
                onClick={() => handleVote('A')}
                disabled={isVoting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-6 py-4 bg-dark rounded-lg text-light font-semibold hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVoting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Отправка...
                  </>
                ) : (
                  'Выбрать этот вариант'
                )}
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Прогресс-бар */}
                <div className="relative h-4 rounded-full bg-dark/50 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary/80"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentA}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>

                {/* Статистика */}
                <div className="flex items-center justify-between">
                  <motion.span
                    className="text-3xl font-bold text-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                  >
                    {Math.round(percentA)}%
                  </motion.span>
                  <span className="text-sm text-light/60">
                    {effect.votesFor.toLocaleString('ru-RU')} голосов
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Вариант B */}
          <motion.div
            whileHover={!hasVoted && !isCheckingVote ? { scale: 1.02 } : {}}
            className={`relative bg-darkCard p-8 rounded-xl transition-all duration-300 border-2 ${
              isCheckingVote
                ? 'opacity-50 pointer-events-none'
                : selectedVariant === 'B'
                ? 'border-secondary bg-secondary/10 shadow-lg shadow-secondary/20'
                : hasVoted
                ? 'border-transparent opacity-80'
                : 'border-transparent hover:border-secondary/50'
            }`}
          >
            {/* Галочка выбора */}
            {selectedVariant === 'B' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-3 -right-3 w-8 h-8 bg-secondary rounded-full flex items-center justify-center shadow-lg"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
            )}

            <h3 className="text-lg font-semibold text-light mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">Б</span>
              Вариант Б
            </h3>
            <p className="text-xl text-center text-light/90 mb-6 min-h-[60px] flex items-center justify-center">
              {variantB}
            </p>

            {!hasVoted && !isCheckingVote ? (
              <motion.button
                onClick={() => handleVote('B')}
                disabled={isVoting || isCheckingVote}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-6 py-4 bg-dark rounded-lg text-light font-semibold hover:bg-gradient-to-r hover:from-secondary hover:to-secondary/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVoting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Отправка...
                  </>
                ) : (
                  'Выбрать этот вариант'
                )}
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Прогресс-бар */}
                <div className="relative h-4 rounded-full bg-dark/50 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-secondary to-secondary/80"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentB}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>

                {/* Статистика */}
                <div className="flex items-center justify-between">
                  <motion.span
                    className="text-3xl font-bold text-secondary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                  >
                    {Math.round(percentB)}%
                  </motion.span>
                  <span className="text-sm text-light/60">
                    {effect.votesAgainst.toLocaleString('ru-RU')} голосов
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Dashboard карточка результатов */}
        {hasVoted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-[#1E1E1E] rounded-2xl p-6 md:p-8 mt-6 border border-white/5"
          >
            {/* Верхняя часть - Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 items-center">
              {/* Левая колонка - Твой выбор */}
              <div className="text-center md:text-left">
                <div className="text-sm text-gray-500 mb-1">Твой выбор</div>
                <div className="text-xl font-bold text-white mb-1">
                  {selectedVariant === 'A' ? 'Вариант А' : 'Вариант Б'}
                </div>
                <div className="text-sm text-gray-400 line-clamp-2">
                  «{selectedVariant === 'A' ? variantA : variantB}»
                </div>
              </div>

              {/* Центральная колонка - VS + Бейдж */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
                  className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  VS
                </motion.div>
                
                {/* Pill-shape бейдж */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 w-fit ${
                    isInMajority
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      : 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  }`}
                >
                  <span>{isInMajority ? '👥' : '🦄'}</span>
                  <span>
                    {isInMajority ? 'Ты с большинством!' : 'Уникальная память!'}
                  </span>
                </motion.div>
                <div className="text-xs text-gray-500 mt-2">
                  {isInMajority
                    ? `${Math.round(userPercent)}% людей думают так же`
                    : `Только ${Math.round(userPercent)}% помнят как ты`
                  }
                </div>
              </div>

              {/* Правая колонка - Большинство выбрало */}
              <div className="text-center md:text-right">
                <div className="text-sm text-gray-500 mb-1">Большинство выбрало</div>
                <div className="text-xl font-bold text-white mb-1">
                  {effect.votesFor > effect.votesAgainst ? 'Вариант А' : 'Вариант Б'}
                </div>
                <div className="text-sm text-gray-400 line-clamp-2">
                  «{effect.votesFor > effect.votesAgainst ? variantA : variantB}»
                </div>
              </div>
            </div>

            {/* Нижняя часть - Подвал */}
            <div className="border-t border-white/10 mt-6 pt-6">
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                {isInMajority
                  ? `Большинство людей помнят этот момент как «${effect.votesFor > effect.votesAgainst ? variantA : variantB}». Твоя память совпадает с памятью большинства.`
                  : `${Math.round(majorityPercent)}% людей помнят этот момент как «${effect.votesFor > effect.votesAgainst ? variantA : variantB}». У тебя редкая версия воспоминаний!`
                }
              </p>
              
              {/* Дисклеймер */}
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Эффект Манделы — это нормально! Нет правильных или неправильных ответов, только разные версии воспоминаний.</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Секция аккордеонов - с большим отступом от карточки статистики */}
        <div className="mt-12 space-y-4">
          {/* Debug info */}
          <div className="text-xs text-gray-500 hidden">Debug: {JSON.stringify(effect.interpretations)}</div>
          
          {/* Блок "Текущее состояние реальности" (Accordion) */}
          {currentState && (
            <div>
              <button
                onClick={() => setShowCurrentState(!showCurrentState)}
                className="w-full flex items-center justify-between p-4 bg-darkCard rounded-xl border border-light/10 hover:border-light/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👁️</span>
                  <span className="text-lg font-semibold text-light">Показать текущее состояние реальности</span>
                </div>
                <motion.svg
                  animate={{ rotate: showCurrentState ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-6 h-6 text-light/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {showCurrentState && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-6 bg-darkCard/50 rounded-xl border border-green-500/20">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">✅</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-green-400 mb-2">Как на самом деле</h4>
                          <p className="text-light/80 leading-relaxed">{renderTextWithLinks(currentState)}</p>
                          
                          {/* Ссылка на источник */}
                          {rawInterpretations?.sourceLink && (
                            <a
                              href={getSafeUrl(rawInterpretations.sourceLink)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                            >
                              <span>🔗</span>
                              <span>{getCleanLinkText(rawInterpretations.sourceLink)}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Блок "Культурные следы / Остатки" (Accordion) */}
          {effect.residue && effect.residue.trim() && (
            <div>
              <button
                onClick={() => setShowResidue(!showResidue)}
                className="w-full flex items-center justify-between p-4 bg-darkCard rounded-xl border border-light/10 hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔍</span>
                  <span className="text-lg font-semibold text-light">Культурные следы (Остатки)</span>
                </div>
                <motion.svg
                  animate={{ rotate: showResidue ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-6 h-6 text-light/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {showResidue && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-6 bg-darkCard/50 rounded-xl border border-purple-500/20">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🕵️</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-purple-400 mb-2">Следы в культуре</h4>
                          <p className="text-light/80 leading-relaxed">{renderTextWithLinks(effect.residue)}</p>
                          
                          {/* Ссылка на источник */}
                          {effect.residueSource && (
                            <a
                              href={getSafeUrl(effect.residueSource)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                            >
                              <span>🔗</span>
                              <span>{getCleanLinkText(effect.residueSource)}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Блок "История / Временная шкала" (Accordion) */}
          {effect.history && effect.history.trim() && (
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between p-4 bg-darkCard rounded-xl border border-light/10 hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📜</span>
                  <span className="text-lg font-semibold text-light">История / Временная шкала</span>
                </div>
                <motion.svg
                  animate={{ rotate: showHistory ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-6 h-6 text-light/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-6 bg-darkCard/50 rounded-xl border border-amber-500/20">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">📅</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-amber-400 mb-2">Временная шкала</h4>
                          <p className="text-light/80 leading-relaxed">{renderTextWithLinks(effect.history)}</p>
                          
                          {/* Ссылка на источник */}
                          {effect.historySource && (
                            <a
                              href={getSafeUrl(effect.historySource)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                            >
                              <span>🔗</span>
                              <span>{getCleanLinkText(effect.historySource)}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Блок "Интерпретации" (Accordion) */}
          {hasInterpretations && (
            <div>
              <button
                onClick={() => setShowInterpretations(!showInterpretations)}
                className="w-full flex items-center justify-between p-4 bg-darkCard rounded-xl border border-light/10 hover:border-light/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧠</span>
                  <span className="text-lg font-semibold text-light">Что об этом говорят (Теории)</span>
                </div>
                <motion.svg
                  animate={{ rotate: showInterpretations ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-6 h-6 text-light/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {showInterpretations && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-6 bg-darkCard/50 rounded-xl border border-light/10">
                      <div className="space-y-6">
                        {/* Научное объяснение */}
                        {rawInterpretations?.scientific && (
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-2xl">🔬</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-light mb-2">Научное объяснение</h4>
                              <p className="text-light/80 leading-relaxed mb-3">
                                {rawInterpretations.scientific}
                              </p>
                              
                              {rawInterpretations.scientificTheory && (
                                <p className="text-sm text-light/60 mb-2">
                                  📖 Теория: <span className="font-medium text-light/70">{rawInterpretations.scientificTheory}</span>
                                </p>
                              )}
                              
                              {rawInterpretations.scientificSource && (
                                <a
                                  href={getSourceUrl(rawInterpretations.scientificSource)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                                >
                                  <span>🔗</span>
                                  <span>{getCleanLinkText(rawInterpretations.scientificSource)}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Мнение сообщества */}
                        {rawInterpretations?.community && (
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-2xl">👥</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-light mb-2">Мнение сообщества</h4>
                              <p className="text-light/80 leading-relaxed mb-3">
                                {rawInterpretations.community}
                              </p>
                              
                              {rawInterpretations.communitySource && (
                                <a
                                  href={getSourceUrl(rawInterpretations.communitySource)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors text-sm"
                                >
                                  <span>🔗</span>
                                  <span>{getCleanLinkText(rawInterpretations.communitySource)}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Навигация между эффектами */}
        <div className="mt-12 pt-8 border-t border-light/10">
          <div className="grid grid-cols-3 gap-3 items-center">
            {/* Предыдущий */}
            {prevEffect ? (
              <Link
                href={`/effect/${prevEffect.id}`}
                className="group flex items-center gap-2 p-3 bg-darkCard rounded-xl hover:bg-darkCard/80 transition-all duration-300 min-w-0"
              >
                <span className="text-xl group-hover:-translate-x-1 transition-transform flex-shrink-0">←</span>
                <div className="text-left min-w-0 flex-1">
                  <div className="text-xs text-light/50">Предыдущий</div>
                  <div className="text-sm text-light font-medium truncate max-w-[120px]">{prevEffect.title}</div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {/* Случайный */}
            <button
              onClick={handleRandomEffect}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl text-light font-semibold hover:from-primary/30 hover:to-secondary/30 transition-all duration-300 border border-light/10"
            >
              <span className="text-lg">🎲</span>
              <span className="text-sm">Случайный</span>
            </button>

            {/* Следующий */}
            {nextEffect ? (
              <Link
                href={`/effect/${nextEffect.id}`}
                className="group flex items-center justify-end gap-2 p-3 bg-darkCard rounded-xl hover:bg-darkCard/80 transition-all duration-300 min-w-0"
              >
                <div className="text-right min-w-0 flex-1">
                  <div className="text-xs text-light/50">Следующий</div>
                  <div className="text-sm text-light font-medium truncate max-w-[120px] ml-auto">{nextEffect.title}</div>
                </div>
                <span className="text-xl group-hover:translate-x-1 transition-transform flex-shrink-0">→</span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* Ссылка на каталог */}
        <div className="mt-8 text-center">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-primary hover:text-secondary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Вернуться в каталог
          </Link>
        </div>
      </div>
    </main>
  );
}
