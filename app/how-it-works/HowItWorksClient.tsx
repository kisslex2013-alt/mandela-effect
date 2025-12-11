'use client';

import { useReality } from '@/lib/context/RealityContext';
import StepCard from '@/components/how-it-works/StepCard';
import { m } from 'framer-motion';
import { 
  Scan, Search,
  CheckCircle2, Split,
  BarChart2, Biohazard,
  UploadCloud, Radio
} from 'lucide-react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HowItWorksClient() {
  const { isUpsideDown } = useReality();

  const steps = [
    {
      id: '01',
      reality: { title: "Сканирование Базы", desc: "Наш алгоритм постоянно индексирует культурные слои в поисках несоответствий.", icon: Scan },
      upside: { title: "Поиск Сбоев", desc: "Матрица не идеальна. В коде есть дыры. Мы ищем остаточный код удаленных линий.", icon: Search }
    },
    {
      id: '02',
      reality: { title: "Верификация Данных", desc: "Ваш голос — это единица данных. Чем больше выборка, тем точнее статистика.", icon: CheckCircle2 },
      upside: { title: "Выбор Временной Линии", desc: "Голосуя, ты создаешь точку сохранения. Не дай им перезаписать твое прошлое.", icon: Split }
    },
    {
      id: '03',
      reality: { title: "Анализ Результатов", desc: "Система сравнивает ваши показатели с глобальной статистикой психотипов.", icon: BarChart2 },
      upside: { title: "Оценка Заражения", desc: "Узнай, насколько глубоко ты в Системе. Если ты помнишь другое — ты угроза.", icon: Biohazard }
    },
    {
      id: '04',
      reality: { title: "Расширение Базы", desc: "Заметили что-то необычное? Отправьте отчет. Наш ИИ проверит факты.", icon: UploadCloud },
      upside: { title: "Сигнал SOS", desc: "Видишь то, чего не видят другие? Отправь данные, пока их не стерли.", icon: Radio }
    }
  ];

  return (
    <div className="h-screen bg-dark pt-20 pb-10 relative overflow-hidden flex flex-col justify-center">
      {/* ФОН: Сетка */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* ФОН: Процессор (Сделан ярче и виден) */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border opacity-20 rounded-full pointer-events-none transition-colors duration-1000 z-0 ${
          isUpsideDown ? 'border-red-500' : 'border-cyan-500'
      }`}>
         <div className={`absolute inset-0 border-2 border-dashed rounded-full animate-spin-slow ${isUpsideDown ? 'border-red-500' : 'border-cyan-500'}`} style={{ animationDuration: '60s' }} />
         <div className={`absolute inset-[25%] border border-dotted rounded-full animate-spin-slow ${isUpsideDown ? 'border-red-500' : 'border-cyan-500'}`} style={{ animationDirection: 'reverse', animationDuration: '40s' }} />
         <div className={`absolute inset-[45%] border border-dashed rounded-full animate-spin-slow ${isUpsideDown ? 'border-red-500' : 'border-cyan-500'}`} style={{ animationDuration: '20s' }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10 w-full">
        
        {/* Заголовок */}
        <m.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-8 md:mb-12"
        >
          <m.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`text-2xl md:text-5xl font-black mb-2 tracking-tight uppercase break-words px-2 ${isUpsideDown ? 'glitch-text text-white' : 'text-white'}`} 
            data-text={isUpsideDown ? "АЛГОРИТМ ВЗЛОМА" : "ПРОТОКОЛ РАБОТЫ"}
          >
            {isUpsideDown ? "АЛГОРИТМ ВЗЛОМА" : "ПРОТОКОЛ РАБОТЫ"}
          </m.h1>
          <m.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`text-xs md:text-base max-w-xl mx-auto px-2 ${isUpsideDown ? 'text-red-400 font-mono' : 'text-light/60'}`}
          >
            {isUpsideDown 
              ? ">> ИНСТРУКЦИЯ ПО ОБХОДУ БЛОКИРОВОК ПАМЯТИ <<" 
              : "Как мы анализируем коллективные искажения памяти."}
          </m.p>
        </m.div>

        {/* PIPELINE (Центральная линия) */}
        <m.div 
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative"
        >
            {/* Сама линия - на мобильных фоном ЗА блоками, на ПК как есть */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-white/10 hidden md:block z-0">
                <m.div 
                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-20 bg-gradient-to-b from-transparent to-current ${isUpsideDown ? 'text-red-500' : 'text-cyan-400'}`}
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
            </div>
            
            {/* Вертикальная линия для мобильных (фоном) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-white/10 md:hidden z-0">
                <m.div 
                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-20 bg-gradient-to-b from-transparent to-current ${isUpsideDown ? 'text-red-500' : 'text-cyan-400'}`}
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Шаги - на мобильных в столбик, на ПК как есть */}
            <div className="relative z-10 flex flex-col gap-4 md:gap-6">
                {steps.map((step, index) => {
                    const content = isUpsideDown ? step.upside : step.reality;

                    return (
                        <StepCard 
                            key={step.id}
                            index={index}
                            stepNumber={step.id}
                            title={content.title}
                            description={content.desc}
                            icon={content.icon}
                            isUpsideDown={isUpsideDown}
                        />
                    );
                })}
            </div>
        </m.div>

        {/* CTA Кнопка */}
        <m.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 text-center"
        >
            <Link href="/catalog">
                <m.button 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className={`px-8 py-3 rounded-xl font-bold text-sm md:text-base flex items-center gap-2 mx-auto transition-all ${
                      isUpsideDown 
                          ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 border-2 border-red-400/80 text-white shadow-[0_0_30px_rgba(239,68,68,1),0_0_60px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,1.2),0_0_80px_rgba(220,38,38,0.7)] hover:border-red-300 hover:scale-105' 
                          : 'bg-white text-black hover:bg-gray-200 shadow-xl hover:scale-105'
                  }`}
                >
                    {isUpsideDown ? 'НАЧАТЬ ВЗЛОМ' : 'ПРИСТУПИТЬ К ИССЛЕДОВАНИЮ'}
                    <ArrowRight className="w-4 h-4" />
                </m.button>
            </Link>
        </m.div>
      </div>
    </div>
  );
}
