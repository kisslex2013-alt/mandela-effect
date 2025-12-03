'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ScanSearch, Vote, BarChart3, UploadCloud, ArrowRight } from 'lucide-react';
import GlitchTitle from '@/components/ui/GlitchTitle';

export default function HowItWorksPage() {
  const steps = [
    {
      id: "01",
      title: "Исследование",
      desc: "Изучите наш каталог. Мы собрали сотни примеров: от логотипов брендов до цитат из фильмов.",
      icon: ScanSearch,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20"
    },
    {
      id: "02",
      title: "Голосование",
      desc: "Выберите вариант, который соответствует вашей памяти. Вариант А — это 'эффект Манделы', Вариант Б — реальность.",
      icon: Vote,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    },
    {
      id: "03",
      title: "Синхронизация",
      desc: "После голосования вы увидите статистику. Узнайте, сколько людей разделяют ваши 'ложные' воспоминания.",
      icon: BarChart3,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20"
    },
    {
      id: "04",
      title: "Вклад в Архив",
      desc: "Если вы помните что-то, чего нет в базе — отправьте нам заявку. ИИ проверит вашу гипотезу.",
      icon: UploadCloud,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-dark relative font-sans text-light overflow-hidden pt-32 pb-20">
      
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] opacity-40" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4">
        
        <div className="text-center mb-16">
          <GlitchTitle text="ПРОТОКОЛ РАБОТЫ" />
          <p className="text-xl text-light/60 mt-4">
            Как пользоваться базой данных аномалий.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-6 rounded-2xl border ${step.border} bg-darkCard/50 backdrop-blur-md overflow-hidden group hover:bg-white/5 transition-colors`}
            >
              <div className={`absolute top-0 right-0 p-4 opacity-10 font-black text-6xl ${step.color}`}>
                {step.id}
              </div>
              
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${step.bg} ${step.color}`}>
                <step.icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-light/60 text-sm leading-relaxed relative z-10">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link href="/catalog" className="inline-block">
            <div className="btn-glitch px-8 py-4 bg-primary text-white font-bold rounded-xl flex items-center gap-2 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all">
              Приступить к исследованию <ArrowRight className="w-5 h-5" />
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
