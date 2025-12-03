'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Database, Eye, Share2, ShieldAlert, ArrowRight, BookOpen } from 'lucide-react';
import GlitchTitle from '@/components/ui/GlitchTitle';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-dark relative font-sans text-light overflow-hidden pt-32 pb-20">
      
      {/* Background Grid (как на главной) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] opacity-40" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-16"
        >
          <div className="mb-4">
            <GlitchTitle text="О ПРОЕКТЕ MANDELA" />
          </div>
          <p className="text-xl text-light/60">
            Архив коллективных сбоев памяти и альтернативных реальностей.
          </p>
        </motion.div>

        <div className="grid gap-8">
          {/* Card 1 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Database className="w-6 h-6" /></div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Миссия Архива</h3>
                <p className="text-light/70 leading-relaxed">
                  Мы собираем, каталогизируем и анализируем случаи Эффекта Манделы. Это феномен, когда большие группы людей помнят события, детали или факты иначе, чем они зафиксированы в официальной истории. Наша цель — не доказать существование параллельных вселенных, а исследовать границы человеческого восприятия.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400"><ShieldAlert className="w-6 h-6" /></div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Технологии</h3>
                <p className="text-light/70 leading-relaxed">
                  Проект работает на базе современных нейросетей (OpenAI, Perplexity, Flux). Мы используем ИИ для поиска новых эффектов в глубинах интернета и генерации визуальных реконструкций "ложных воспоминаний", чтобы вы могли увидеть то, что помните.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-4">
          <Link href="/how-it-works" className="w-full md:w-auto">
            <div className="btn-glitch px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
              <BookOpen className="w-4 h-4" /> Изучить протокол
            </div>
          </Link>
          <Link href="/catalog" className="w-full md:w-auto">
            <div className="btn-glitch px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
              Перейти в Архив <ArrowRight className="w-5 h-5" />
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
