'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuizEffects, type EffectResult } from '@/app/actions/effects';
import { saveVote } from '@/app/actions/votes';
import { getVisitorId } from '@/lib/visitor';
import { votesStore } from '@/lib/votes-store';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import toast from 'react-hot-toast';

export default function QuizClient() {
  const router = useRouter();
  const [effects, setEffects] = useState<EffectResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B' | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const visitorId = getVisitorId();
        const data = await getQuizEffects(10, visitorId || undefined);
        setEffects(data);
      } catch (e) {
        toast.error('Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, []);

  const handleVote = async (variant: 'A' | 'B') => {
    if (isVoting || isRedirecting) return;
    
    // 1. Мгновенный визуальный отклик
    setIsVoting(true);
    setSelectedVariant(variant);

    const currentEffect = effects[currentIndex];
    const isMandela = variant === 'A';

    // 2. Логика сохранения (без ожидания UI)
    votesStore.set(currentEffect.id, variant);
    
    // Отправляем на сервер
    try {
      const visitorId = getVisitorId();
      if (visitorId) {
        await saveVote({
          visitorId,
          effectId: currentEffect.id,
          variant,
        });
      }
    } catch (error) {
      console.error('Ошибка сохранения голоса:', error);
    }

    // Пауза для восприятия выбора
    await new Promise(r => setTimeout(r, 600));

    // 3. Переход
    if (currentIndex < effects.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedVariant(null);
      setIsVoting(false);
    } else {
      // Финал
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsRedirecting(true);
    // Имитация бурной деятельности системы перед переходом
    setTimeout(() => {
      router.push('/my-memory');
    }, 2000);
  };

  if (loading) return <div className="min-h-screen bg-dark flex items-center justify-center text-primary animate-pulse">Загрузка симуляции...</div>;

  if (effects.length === 0) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Нет доступных вопросов</h2>
          <p className="text-light/60 mb-8">Вы уже прошли все доступные эффекты!</p>
          <button 
            onClick={() => router.push('/catalog')}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Перейти в каталог
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / effects.length) * 100;
  const currentEffect = effects[currentIndex];

  // Парсим варианты из content
  const parseVariantsFromContent = (content: string): { variantA: string; variantB: string } => {
    const lines = content.split('\n');
    const variantALine = lines.find((l) => l.startsWith('Вариант А:'));
    const variantBLine = lines.find((l) => l.startsWith('Вариант Б:'));
    return {
      variantA: variantALine?.replace('Вариант А: ', '').trim() || 'Как я помню',
      variantB: variantBLine?.replace('Вариант Б: ', '').trim() || 'Как в реальности',
    };
  };

  const { variantA, variantB } = currentEffect 
    ? parseVariantsFromContent(currentEffect.content || '')
    : { variantA: 'Как я помню', variantB: 'Как в реальности' };

  return (
    <div className="min-h-screen bg-dark py-8 px-4 flex flex-col items-center relative overflow-hidden">
      
      {/* Глитч-оверлей при переходе */}
      <AnimatePresence>
        {isRedirecting && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
          >
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 animate-pulse mb-4 glitch-text" data-text="СИНХРОНИЗАЦИЯ...">
              СИНХРОНИЗАЦИЯ...
            </div>
            <div className="w-64 h-1 bg-dark/50 rounded overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: "100%" }} 
                transition={{ duration: 1.5 }} 
                className="h-full bg-primary" 
              />
            </div>
            {/* CSS шум */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)' }}></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Прогресс */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex justify-between text-xs text-light/40 mb-2 font-mono">
          <span>ВОПРОС {currentIndex + 1} / {effects.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div initial={false} animate={{ width: `${progress}%` }} className="h-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        </div>
      </div>

      {/* Карточка */}
      <div className="max-w-2xl w-full">
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentEffect.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-light/10 shadow-2xl bg-darkCard">
               {currentEffect.imageUrl ? (
                 <ImageWithSkeleton src={currentEffect.imageUrl} alt={currentEffect.title} fill className="object-cover" />
               ) : <div className="w-full h-full flex items-center justify-center bg-white/5 text-4xl">🖼️</div>}
               <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">{currentEffect.category}</div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{currentEffect.title}</h1>
              <p className="text-light/60 text-lg">{currentEffect.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Кнопка А */}
                <button 
                    onClick={() => handleVote('A')}
                    disabled={isVoting}
                    className={`relative p-6 rounded-2xl border transition-all text-left group overflow-hidden ${
                        selectedVariant === 'A' 
                            ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)] scale-[1.02]' 
                            : 'bg-darkCard border-light/10 hover:border-purple-500/50 hover:bg-purple-500/5'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${selectedVariant === 'A' ? 'bg-purple-500 text-white' : 'bg-purple-500/10 text-purple-400'}`}>A</div>
                    </div>
                    <div className="text-lg font-bold text-light group-hover:text-purple-300 transition-colors">
                        {variantA}
                    </div>
                </button>

                {/* Кнопка Б */}
                <button 
                    onClick={() => handleVote('B')}
                    disabled={isVoting}
                    className={`relative p-6 rounded-2xl border transition-all text-left group overflow-hidden ${
                        selectedVariant === 'B' 
                            ? 'bg-green-500/20 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)] scale-[1.02]' 
                            : 'bg-darkCard border-light/10 hover:border-green-500/50 hover:bg-green-500/5'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${selectedVariant === 'B' ? 'bg-green-500 text-white' : 'bg-green-500/10 text-green-400'}`}>B</div>
                    </div>
                    <div className="text-lg font-bold text-light group-hover:text-green-300 transition-colors">
                        {variantB}
                    </div>
                </button>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
