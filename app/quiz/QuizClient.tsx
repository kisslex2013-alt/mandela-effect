'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuizEffects, type EffectResult } from '@/app/actions/effects';
import { saveVote } from '@/app/actions/votes';
import { getVisitorId } from '@/lib/visitor';
import { votesStore } from '@/lib/votes-store';
import { ArrowRight, CheckCircle2, RotateCcw, Home } from 'lucide-react';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

export default function QuizClient() {
  const router = useRouter();
  const [effects, setEffects] = useState<EffectResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  // Загрузка вопросов
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const visitorId = getVisitorId();
        const data = await getQuizEffects(10, visitorId || undefined);
        setEffects(data);
      } catch (e) {
        console.error(e);
        toast.error('Не удалось загрузить вопросы');
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, []);

  const handleVote = async (variant: 'A' | 'B') => {
    if (isVoting) return;
    setIsVoting(true);

    const currentEffect = effects[currentIndex];
    const isMandela = variant === 'A'; // Вариант А считаем "Манделой"

    // 1. Сохраняем голос глобально (для Паспорта)
    votesStore.set(currentEffect.id, variant);

    // 2. Отправляем на сервер
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

    // 3. Подсчет "очков" (условно, совпадение с большинством)
    // Здесь простая логика: если выбрал Реальность (B) -> +1 к "реализму"
    // Но для квиза можно считать просто количество ответов
    if (!isMandela) {
        setScore(s => s + 1);
    }

    // Анимация перехода
    await new Promise(r => setTimeout(r, 400));

    if (currentIndex < effects.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsVoting(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsFinished(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-light/60">Подготовка симуляции...</p>
        </div>
      </div>
    );
  }

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

  if (isFinished) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-darkCard border border-light/10 p-8 rounded-3xl max-w-lg w-full text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">Тест завершен!</h2>
          <p className="text-light/60 mb-8">
            Ваши ответы сохранены в системе. Теперь мы можем определить вашу родную временную линию.
          </p>

          <div className="grid gap-3">
            <button 
              onClick={() => router.push('/my-memory')}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              Сгенерировать Паспорт <ArrowRight className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-light rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Пройти заново
            </button>
            
            <button 
              onClick={() => router.push('/')}
              className="w-full py-3 text-light/40 hover:text-light transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Home className="w-4 h-4" /> На главную
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Парсим варианты
  const contentLines = currentEffect.content.split('\n');
  const variantA = contentLines.find(l => l.startsWith('Вариант А:'))?.replace('Вариант А: ', '') || 'Вариант А';
  const variantB = contentLines.find(l => l.startsWith('Вариант Б:'))?.replace('Вариант Б: ', '') || 'Вариант Б';

  return (
    <div className="min-h-screen bg-dark py-8 px-4 flex flex-col items-center">
      
      {/* Прогресс */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex justify-between text-xs text-light/40 mb-2 font-mono">
          <span>ВОПРОС {currentIndex + 1} / {effects.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-darkCard rounded-full overflow-hidden border border-light/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-primary to-purple-500"
          />
        </div>
      </div>

      {/* Карточка Вопроса */}
      <div className="max-w-2xl w-full">
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentEffect.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Картинка */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-light/10 shadow-2xl bg-darkCard">
               {currentEffect.imageUrl ? (
                 <ImageWithSkeleton src={currentEffect.imageUrl} alt={currentEffect.title} fill className="object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-white/5 text-4xl">🖼️</div>
               )}
               <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">
                 {currentEffect.category}
               </div>
            </div>

            {/* Текст */}
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{currentEffect.title}</h1>
              <p className="text-light/60 text-lg">{currentEffect.description}</p>
            </div>

            {/* Кнопки */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    onClick={() => handleVote('A')}
                    disabled={isVoting}
                    className="group relative overflow-hidden p-6 rounded-2xl bg-darkCard border border-light/10 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10 text-left active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-sm">A</div>
                    </div>
                    <div className="text-lg font-bold text-light group-hover:text-purple-300 transition-colors">{variantA}</div>
                </button>

                <button 
                    onClick={() => handleVote('B')}
                    disabled={isVoting}
                    className="group relative overflow-hidden p-6 rounded-2xl bg-darkCard border border-light/10 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10 text-left active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 font-bold text-sm">B</div>
                    </div>
                    <div className="text-lg font-bold text-light group-hover:text-green-300 transition-colors">{variantB}</div>
                </button>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
