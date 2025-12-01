import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import QRCode from 'react-qr-code';
import { Save, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

async function getResult(id: string) {
  const result = await prisma.identityResult.findUnique({
    where: { id },
  });
  if (!result) return null;
  return {
    ...result,
    stats: result.stats as Record<string, any>
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getResult(id);

  if (!result) return { title: 'Результат не найден' };

  return {
    title: `${result.archetype} | Эффект Манделы`,
    description: `Мой уровень синхронизации с реальностью: ${result.syncRate}%. Проверь свою память!`,
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const result = await getResult(id);

  if (!result) notFound();

  return (
    <div className="min-h-screen bg-dark py-12 px-4 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full">
        
        {/* Хедер */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-4">
            <ArrowRight className="w-4 h-4 rotate-180" /> На главную
          </Link>
          <h1 className="text-3xl font-bold text-white">Результат анализа памяти</h1>
        </div>

        {/* Карточка Паспорта (Копия дизайна из IdentityClient) */}
        <div className="bg-darkCard/50 backdrop-blur-xl border border-light/10 rounded-3xl overflow-hidden relative shadow-2xl shadow-purple-900/20 mb-8">
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Левая колонка */}
              <div className="p-8 border-b md:border-b-0 md:border-r border-light/10 relative">
                 <div className={`absolute top-4 right-4 border-4 transform rotate-12 px-3 py-1 font-black text-xl opacity-80 tracking-widest ${
                   result.syncRate > 80 ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'
                 }`}>
                   {result.syncRate > 80 ? 'VERIFIED' : 'ANOMALY'}
                 </div>

                 <div className="text-light/40 text-xs font-mono mb-2">АРХЕТИП ЛИЧНОСТИ</div>
                 <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight glitch-text" data-text={result.archetype}>
                   {result.archetype}
                 </h2>

                 <div className="mb-8">
                   <div className="flex items-end gap-2 mb-2">
                     <span className={`text-6xl font-bold ${result.syncRate > 50 ? 'text-green-400' : 'text-purple-400'}`}>
                       {result.syncRate}%
                     </span>
                     <span className="text-light/60 pb-2">синхронизации</span>
                   </div>
                   <div className="w-full bg-dark/50 h-2 rounded-full overflow-hidden">
                     <div 
                       className={`h-full ${result.syncRate > 50 ? 'bg-green-400' : 'bg-purple-400'}`} 
                       style={{ width: `${result.syncRate}%` }}
                     />
                   </div>
                   <p className="text-xs text-light/40 mt-2 font-mono">
                     Текущая реальность: Земля-1218
                   </p>
                 </div>

                 <div className="bg-light/5 rounded-xl p-4 border border-light/5">
                   <p className="text-light/80 italic leading-relaxed">
                     "{result.description}"
                   </p>
                 </div>
              </div>

              {/* Правая колонка */}
              <div className="p-8 flex flex-col items-center justify-center bg-black/20 relative overflow-hidden">
                <div className="w-full h-full flex items-center justify-center min-h-[200px]">
                   {/* Упрощенный визуал для серверной страницы (без Recharts для скорости) */}
                   <div className="text-center">
                      <div className="w-32 h-32 mx-auto rounded-full border-4 border-dashed border-light/20 flex items-center justify-center mb-4">
                        <CheckCircle2 className={`w-16 h-16 ${result.syncRate > 50 ? 'text-green-400' : 'text-purple-400'}`} />
                      </div>
                      <div className="text-light/60 text-sm">График доступен в личном кабинете</div>
                   </div>
                </div>

                <div className="w-full flex items-end justify-between mt-auto gap-4 pt-8">
                  <div className="flex-1">
                    <div className="text-xs text-light/30 mb-1">МЫСЛЬ ДНЯ</div>
                    {result.stats.quote && (
                        <blockquote className="text-xs text-light/60 border-l-2 border-primary pl-2">
                        {result.stats.quote}
                        </blockquote>
                    )}
                  </div>
                  <div className="bg-white p-2 rounded-lg shrink-0">
                    <QRCode value={`https://mandela-effect.app/share/${result.id}`} size={64} />
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* CTA */}
        <div className="text-center">
            <Link 
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:scale-105"
            >
                Я тоже хочу проверить память <ArrowRight className="w-5 h-5" />
            </Link>
        </div>

      </div>
    </div>
  );
}

