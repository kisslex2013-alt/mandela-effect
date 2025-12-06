'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EffectCard from '@/components/EffectCard';
import CustomSelect, { type SelectOption } from '@/components/ui/CustomSelect';
import { votesStore } from '@/lib/votes-store';
import { hasNewComments, getReadCommentsData } from '@/lib/comments-tracker';
import { 
  Search, Filter, SortAsc, Terminal, FileWarning, 
  Film, Music, Tag, User, Globe, Gamepad2, Baby, Ghost, HelpCircle,
  Flame, Scale, Clock, ArrowDownAZ, LayoutGrid, X
} from 'lucide-react';
import { CATEGORY_MAP } from '@/lib/constants';

interface Category {
  id: string;
  slug: string;
  name: string;
  emoji: string;
}

interface Effect {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string | null;
  votesFor: number;
  votesAgainst: number;
  createdAt: string;
  residue?: string | null;
  history?: string | null;
  commentsCount?: number;
  commentsWithMediaCount?: number;
  views: number; // <-- ДОБАВЛЕНО
}

interface CatalogClientProps {
  initialEffects: Effect[];
  categories: Category[];
}

type SortType = 'newest' | 'popular' | 'controversial' | 'alphabetical';

// Цвета категорий для подсветки
const CAT_COLORS: Record<string, string> = {
  films: 'blue',
  brands: 'orange',
  popculture: 'purple',
  music: 'pink',
  people: 'yellow',
  geography: 'cyan',
  childhood: 'green',
  russian: 'red',
  other: 'gray',
};

// Tailwind классы для цветов
const COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
  pink: 'bg-pink-500/20 text-pink-400 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
  green: 'bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]',
  red: 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
  gray: 'bg-gray-500/20 text-gray-400 border-gray-500/50 shadow-[0_0_15px_rgba(107,114,128,0.3)]',
};

export default function CatalogClient({ initialEffects, categories }: CatalogClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('popular');
  const [hideVoted, setHideVoted] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, 'A' | 'B'>>({});
  const [mounted, setMounted] = useState(false);
  const [readCommentsData, setReadCommentsData] = useState<Record<string, { lastReadAt: string; lastCommentCount: number }>>({});

  useEffect(() => {
    const loadVotes = () => {
      const votes = votesStore.get();
      setUserVotes(votes);
    };
    
    const loadReadComments = () => {
      const data = getReadCommentsData();
      setReadCommentsData(data);
    };
    
    loadVotes();
    loadReadComments();
    setMounted(true);
    
    // Слушаем событие обновления прочитанных комментариев
    const handleCommentsRead = (event: Event) => {
      // Обновляем данные о прочитанных комментариях из localStorage
      loadReadComments();
      // Принудительно обновляем компонент для пересчета hasNewComments
      setMounted(false);
      setTimeout(() => {
        setMounted(true);
        loadReadComments(); // Повторно загружаем данные после обновления mounted
      }, 10);
    };
    
    window.addEventListener('votes-updated', loadVotes);
    window.addEventListener('comments-read', handleCommentsRead);
    return () => {
      window.removeEventListener('votes-updated', loadVotes);
      window.removeEventListener('comments-read', handleCommentsRead);
    };
  }, []);

  const getCategoryIcon = (slug: string) => {
    const props = { className: "w-5 h-5 shrink-0" }; // shrink-0 важен
    switch (slug) {
      case 'films': return <Film {...props} />;
      case 'music': return <Music {...props} />;
      case 'brands': return <Tag {...props} />;
      case 'people': return <User {...props} />;
      case 'geography': return <Globe {...props} />;
      case 'popculture': return <Gamepad2 {...props} />;
      case 'childhood': return <Baby {...props} />;
      case 'russian': return <Ghost {...props} />;
      default: return <HelpCircle {...props} />;
    }
  };

  const filteredEffects = useMemo(() => {
    let result = Array.isArray(initialEffects) ? [...initialEffects] : [];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(query) || 
        e.description.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(e => e.category === selectedCategory);
    }

    if (hideVoted) {
      result = result.filter(e => !userVotes[e.id]);
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        result.sort((a, b) => (b.votesFor + b.votesAgainst) - (a.votesFor + a.votesAgainst));
        break;
      case 'controversial':
        result.sort((a, b) => {
          const totalA = a.votesFor + a.votesAgainst;
          const ratioA = totalA > 0 ? Math.abs(50 - (a.votesFor / totalA * 100)) : 100;
          const totalB = b.votesFor + b.votesAgainst;
          const ratioB = totalB > 0 ? Math.abs(50 - (b.votesFor / totalB * 100)) : 100;
          return ratioA - ratioB;
        });
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
        break;
    }

    return result;
  }, [initialEffects, searchQuery, selectedCategory, sortBy, hideVoted, userVotes]);

  const sortOptions: SelectOption[] = [
    { value: 'popular', label: 'Популярные', icon: <Flame className="w-4 h-4" /> },
    { value: 'controversial', label: 'Спорные', icon: <Scale className="w-4 h-4" /> },
    { value: 'newest', label: 'Новые', icon: <Clock className="w-4 h-4" /> },
    { value: 'alphabetical', label: 'А-Я', icon: <ArrowDownAZ className="w-4 h-4" /> },
  ];

  if (!mounted) return <div className="min-h-screen bg-dark" />;

  return (
    <div className="min-h-screen bg-dark relative font-sans text-light pt-32">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight glitch-text" data-text="АРХИВ АНОМАЛИЙ">
            АРХИВ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">АНОМАЛИЙ</span>
          </h1>
          <p className="text-light/60 text-lg">База данных сбоев реальности. Доступ разрешен.</p>
        </div>

        <div className="space-y-6 mb-12">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Terminal className="h-5 w-5 text-light/40 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="> Search database..._" className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-light/10 rounded-xl text-light placeholder-light/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono" />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-light/40 hover:text-light"><X className="h-5 w-5" /></button>}
                </div>
                <div className="w-full md:w-64 shrink-0">
                    <CustomSelect value={sortBy} onChange={(val) => setSortBy(val as SortType)} options={sortOptions} placeholder="Сортировка" className="h-full" />
                </div>
            </div>

            {/* ЛЕНТА КАТЕГОРИЙ (Smart Pills) + Чекбокс "Скрыть исследованные" */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {/* Кнопка ВСЕ (статичная) */}
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all border whitespace-nowrap
                            ${selectedCategory === 'all' 
                                ? 'bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                : 'bg-darkCard border-light/10 text-light/50 hover:border-light/30 hover:text-light'
                            }`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                        Все сектора
                    </button>

                    {/* Динамические кнопки категорий */}
                    {Array.isArray(categories) && categories.map(cat => {
                        const colorKey = CAT_COLORS[cat.slug] || 'gray';
                        const isActive = selectedCategory === cat.slug;
                        const activeClass = COLOR_CLASSES[colorKey];
                        const displayName = CATEGORY_MAP[cat.slug]?.name || cat.name;

                        return (
                            <motion.button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.slug)}
                                initial="collapsed"
                                animate={isActive ? "expanded" : "collapsed"}
                                whileHover="expanded"
                                className={`flex items-center justify-center px-3 py-2.5 rounded-full text-sm font-bold transition-all border whitespace-nowrap h-10
                                    ${isActive 
                                        ? activeClass
                                        : 'bg-darkCard border-light/10 text-light/50 hover:border-light/30 hover:text-light'
                                    }`}
                            >
                                {getCategoryIcon(cat.slug)}
                                <motion.span
                                    variants={{
                                        collapsed: { width: 0, opacity: 0, marginLeft: 0, display: 'none' },
                                        expanded: { width: 'auto', opacity: 1, marginLeft: 8, display: 'block' }
                                    }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    {displayName}
                                </motion.span>
                            </motion.button>
                        );
                    })}
                </div>
                
                {/* Чекбокс "Скрыть исследованные" - справа на десктопе, под кнопками на мобильных */}
                <label className="flex items-center gap-2 cursor-pointer group bg-darkCard/95 backdrop-blur-sm border border-light/10 rounded-lg px-3 py-2 shadow-lg shrink-0 self-center md:self-auto">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 ${hideVoted ? 'bg-primary border-primary' : 'border-light/30 group-hover:border-light/60'}`}>
                        {hideVoted && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><div className="w-2 h-2 bg-black rounded-sm" /></motion.div>}
                    </div>
                    <input type="checkbox" checked={hideVoted} onChange={(e) => setHideVoted(e.target.checked)} className="hidden" />
                    <span className={`text-sm font-medium transition-colors whitespace-nowrap ${hideVoted ? 'text-light' : 'text-light/50 group-hover:text-light/80'}`}>Скрыть исследованные</span>
                </label>
            </div>
        </div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode='popLayout'>
                    {filteredEffects.length > 0 ? (
                    filteredEffects.map((effect, index) => {
                      const readData = readCommentsData[effect.id];
                      const commentCount = effect.commentsCount || 0;
                      const hasNew = mounted && (() => {
                        if (!readData) {
                          return commentCount > 0;
                        }
                        return commentCount > readData.lastCommentCount;
                      })();
                      
                      return (
                        <motion.div
                            key={`${effect.id}-${mounted ? 'mounted' : 'unmounted'}-${readData?.lastCommentCount || 0}`}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                            <EffectCard 
                                {...effect} 
                                hasVoted={!!userVotes[effect.id]} 
                                initialUserVote={userVotes[effect.id] ?? null}
                                showProgress={!!userVotes[effect.id]}
                                priority={index < 6}
                                className="bg-darkCard/80 backdrop-blur-sm border border-light/10 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] transition-all"
                                hasNewComments={hasNew}
                            />
                        </motion.div>
                      );
                    })
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center border border-dashed border-light/10 rounded-3xl bg-white/5">
                        <div className="flex justify-center mb-4"><div className="p-4 bg-red-500/10 rounded-full animate-pulse"><FileWarning className="w-12 h-12 text-red-500" /></div></div>
                        <h3 className="text-2xl font-black text-white mb-2 glitch-text" data-text="DATA CORRUPTED">DATA CORRUPTED</h3>
                        <p className="text-light/50">Объект не найден в текущем секторе памяти.</p>
                        <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setHideVoted(false); }} className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-mono text-sm transition-colors">&gt; Reset_filters</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
