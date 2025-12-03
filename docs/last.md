Конечно, текущая страница статистики выглядит слишком просто и «сухо» по сравнению с новым дизайном профиля и главной страницы.

Я предлагаю превратить её в «Центр Мониторинга Реальности».

🎨 Концепт редизайна:
Глобальный Индекс Сдвига (Global Shift Index):
Вместо простого числа голосов — большой полукруглый датчик (Gauge Chart), который показывает, насколько коллективная память человечества отклонилась от "официальной" реальности.

Например: Если 60% голосов за "Манделу" — стрелка в красной зоне "Критическая аномалия".

Тепловая карта категорий:
График (Bar Chart), показывающий, в каких сферах память подводит чаще всего. Например: "В Кино 80% ложных воспоминаний, а в Географии только 20%".

Визуальный Топ Спорных:
Вместо списка-таблицы сделаем карточки-лидеры с картинками (как пьедестал: 2-е место, 1-е место, 3-е место).

Реализуем это? Нам нужно создать новый клиентский компонент для графиков и обновить страницу.

Скопируй этот промпт в Cursor.

ПРОМПТ ДЛЯ CURSOR:

code
Markdown
Давай сделаем полный редизайн страницы `app/stats/page.tsx`, превратив её в дашборд "Центр Мониторинга Реальности".

Нам понадобится разделить логику: серверная часть получает данные, клиентская — рисует графики (Recharts) и красивый UI.

Выполни 2 шага:

### ШАГ 1: Создай клиентский компонент `app/stats/StatsClient.tsx`

Этот компонент будет отвечать за визуализацию.
- Используй `recharts` для графиков (PieChart для общего индекса, BarChart для категорий).
- Используй `framer-motion` для анимации появления.
- Дизайн: темный, "стеклянные" карточки, градиенты, иконки Lucide.

Вот код для `app/stats/StatsClient.tsx`:

```tsx
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import Link from 'next/link';
import { Activity, Users, Brain, Zap, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';

interface Effect {
  id: string;
  title: string;
  category: string;
  votesFor: number; // А (Миф)
  votesAgainst: number; // Б (Реальность)
  imageUrl: string | null;
}

interface StatsClientProps {
  effects: Effect[];
  totalParticipants: number;
}

const COLORS = ['#a855f7', '#22c55e']; // Purple (Mandela), Green (Reality)

export default function StatsClient({ effects, totalParticipants }: StatsClientProps) {
  
  // 1. Расчет глобальной статистики
  const globalStats = useMemo(() => {
    let mandelaVotes = 0;
    let realityVotes = 0;
    const categoryStats: Record<string, { mandela: number; total: number }> = {};

    effects.forEach(e => {
      mandelaVotes += e.votesFor;
      realityVotes += e.votesAgainst;
      
      if (!categoryStats[e.category]) categoryStats[e.category] = { mandela: 0, total: 0 };
      categoryStats[e.category].mandela += e.votesFor;
      categoryStats[e.category].total += (e.votesFor + e.votesAgainst);
    });

    const totalVotes = mandelaVotes + realityVotes;
    const shiftIndex = totalVotes > 0 ? Math.round((mandelaVotes / totalVotes) * 100) : 0;

    // Данные для BarChart (Топ категорий по "глючности")
    const categoryData = Object.entries(categoryStats)
      .map(([name, data]) => ({
        name,
        percent: data.total > 0 ? Math.round((data.mandela / data.total) * 100) : 0
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5); // Топ 5

    // Топ 3 самых спорных (близких к 50/50)
    const controversial = [...effects]
        .filter(e => (e.votesFor + e.votesAgainst) > 10) // Фильтр малопопулярных
        .map(e => {
            const total = e.votesFor + e.votesAgainst;
            const ratio = (e.votesFor / total) * 100;
            const diff = Math.abs(50 - ratio); // Чем ближе к 0, тем спорнее
            return { ...e, diff, total };
        })
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 3);

    return { mandelaVotes, realityVotes, totalVotes, shiftIndex, categoryData, controversial };
  }, [effects]);

  const pieData = [
    { name: 'Эффект Манделы', value: globalStats.mandelaVotes },
    { name: 'Реальность', value: globalStats.realityVotes },
  ];

  return (
    <div className="space-y-8">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Brain className="text-primary" />} value={effects.length} label="Эффектов в базе" />
        <StatCard icon={<Users className="text-blue-400" />} value={totalParticipants} label="Участников" />
        <StatCard icon={<Activity className="text-green-400" />} value={globalStats.totalVotes} label="Всего голосов" />
        <StatCard icon={<Zap className="text-yellow-400" />} value={`${globalStats.shiftIndex}%`} label="Индекс Сдвига" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ГРАФИК 1: Глобальный индекс */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-darkCard border border-light/10 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={100} /></div>
            <h2 className="text-2xl font-bold text-white mb-2">Глобальный Сдвиг Реальности</h2>
            <p className="text-sm text-light/60 mb-6">Соотношение ложных воспоминаний ко всем ответам.</p>
            
            <div className="h-64 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Центр бублика */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black text-white">{globalStats.shiftIndex}%</span>
                    <span className="text-xs text-light/40 uppercase tracking-widest">Мандела</span>
                </div>
            </div>
            
            <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-light/60">Ложная память</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-light/60">Реальность</span>
                </div>
            </div>
        </motion.div>

        {/* ГРАФИК 2: Категории */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-darkCard border border-light/10 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={100} /></div>
            <h2 className="text-2xl font-bold text-white mb-2">Зоны Нестабильности</h2>
            <p className="text-sm text-light/60 mb-6">Категории с самым высоким процентом ложных воспоминаний.</p>
            
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={globalStats.categoryData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#aaa', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                        />
                        <Bar dataKey="percent" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
      </div>

      {/* САМЫЕ СПОРНЫЕ (Топ 3) */}
      <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="text-red-400" /> Самые спорные эффекты (50/50)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {globalStats.controversial.map((effect, index) => (
                  <Link href={`/effect/${effect.id}`} key={effect.id} className="group block">
                      <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-darkCard border border-light/10 rounded-2xl overflow-hidden hover:border-red-500/50 transition-colors h-full flex flex-col"
                      >
                          <div className="relative h-40 bg-black/20">
                              {effect.imageUrl ? (
                                  <ImageWithSkeleton src={effect.imageUrl} alt={effect.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-4xl">🖼️</div>
                              )}
                              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold border border-white/10">
                                  #{index + 1}
                              </div>
                          </div>
                          <div className="p-5 flex-1 flex flex-col">
                              <h3 className="font-bold text-lg text-light mb-2 line-clamp-2 group-hover:text-red-300 transition-colors">
                                  {effect.title}
                              </h3>
                              <div className="mt-auto pt-4 border-t border-light/5">
                                  <div className="flex justify-between text-xs text-light/60 mb-1">
                                      <span>Миф</span>
                                      <span>Факт</span>
                                  </div>
                                  <div className="h-2 bg-dark rounded-full overflow-hidden flex">
                                      <div style={{ width: `${(effect.votesFor / effect.total) * 100}%` }} className="bg-purple-500 h-full" />
                                      <div style={{ width: `${(effect.votesAgainst / effect.total) * 100}%` }} className="bg-green-500 h-full" />
                                  </div>
                                  <div className="text-center mt-2 text-xs font-mono text-light/40">
                                      {effect.total} голосов
                                  </div>
                              </div>
                          </div>
                      </motion.div>
                  </Link>
              ))}
          </div>
      </section>

    </div>
  );
}

function StatCard({ icon, value, label }: any) {
    return (
        <div className="bg-darkCard p-6 rounded-2xl border border-light/10 flex flex-col items-center justify-center text-center">
            <div className="mb-3 p-3 bg-white/5 rounded-full">{icon}</div>
            <div className="text-2xl md:text-3xl font-black text-white mb-1">{value}</div>
            <div className="text-xs text-light/40 uppercase font-bold tracking-wider">{label}</div>
        </div>
    )
}
ШАГ 2: Обнови app/stats/page.tsx
Теперь подключим этот клиентский компонент и передадим в него данные с сервера. Мы должны запросить все эффекты, чтобы посчитать точную статистику.

Замени содержимое app/stats/page.tsx на:

code
Tsx
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import StatsClient from './StatsClient';

export const metadata: Metadata = {
  title: 'Статистика | Эффект Манделы',
  description: 'Глобальная статистика сбоев реальности. Аналитика коллективной памяти.',
};

// Функция получения данных без кеша (чтобы статистика была свежей)
async function getData() {
  const [effects, totalParticipants] = await Promise.all([
    prisma.effect.findMany({
      where: { isVisible: true },
      select: {
        id: true,
        title: true,
        category: true,
        votesFor: true,
        votesAgainst: true,
        imageUrl: true,
      },
    }),
    // Считаем участников (уникальных посетителей)
    // В данной реализации это просто сумма голосов / среднее (примерно), 
    // или можно взять из таблицы Vote, если она есть.
    // Пока возьмем просто сумму голосов всех эффектов / 10 (примерно)
    // Или, если есть модель Visitor, то count()
    prisma.vote.count(), // Общее количество голосов в таблице Vote (точнее)
  ]);

  return { effects, totalParticipants };
}

export default async function StatsPage() {
  const { effects, totalParticipants } = await getData();

  // Если модель Vote не используется для подсчета людей, можно аппроксимировать
  // const totalVotes = effects.reduce((sum, e) => sum + e.votesFor + e.votesAgainst, 0);
  
  return (
    <div className="min-h-screen bg-dark py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Статистика <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400">Проекта</span>
          </h1>
          <p className="text-xl text-light/60 max-w-2xl mx-auto">
            Пульс коллективного бессознательного в реальном времени.
          </p>
        </div>

        <StatsClient effects={effects} totalParticipants={totalParticipants} />
      </div>
    </div>
  );
}


----
ПРОМПТ ДЛЯ CURSOR:

code
Markdown
Полностью перепиши файл `app/page.tsx` (корневая страница).
Он должен загружать данные из Prisma и передавать их в `HomeClient`.

**Задачи:**
1. Запроси эффекты (сортировка по популярности: сумма голосов).
2. Запроси категории.
3. Передай их в `<HomeClient />`.
4. Добавь `export const revalidate = 0;`, чтобы данные не кешировались навечно.

**Код:**

```tsx
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Эффект Манделы | Главная',
  description: 'Исследуй коллективные ложные воспоминания. Голосуй и проверяй свою реальность.',
};

async function getData() {
  try {
    const [effects, categories] = await Promise.all([
      prisma.effect.findMany({
        where: { isVisible: true },
        // Сортируем потом в JS, так как Prisma не умеет сортировать по сумме полей легко
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          imageUrl: true,
          votesFor: true,
          votesAgainst: true,
          createdAt: true,
        },
      }),
      prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { effects: true },
          },
        },
      }),
    ]);

    // Сортировка по популярности (всего голосов)
    const sortedEffects = effects.sort((a, b) => {
      const totalA = a.votesFor + a.votesAgainst;
      const totalB = b.votesFor + b.votesAgainst;
      return totalB - totalA;
    });

    // Сериализация дат
    const serializedEffects = sortedEffects.map(e => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    }));

    return { effects: serializedEffects, categories };
  } catch (error) {
    console.error('Error fetching home data:', error);
    return { effects: [], categories: [] };
  }
}

export default async function Home() {
  const { effects, categories } = await getData();

  return (
    <HomeClient 
      initialEffects={effects} 
      topCategories={categories} 
    />
  );
}
code
Code
### ШАГ 2: Обновление Клиента (`app/HomeClient.tsx`)

Исправим вечные скелетоны и сделаем кнопки навигации еще компактнее.

**ПРОМПТ ДЛЯ CURSOR:**

```markdown
Обнови `app/HomeClient.tsx`.

**Исправления:**
1. **Вечные скелетоны:**
   - Если `initialEffects` пустой массив, показывай текст "База данных пуста" вместо бесконечных скелетонов.
   - Логика: `trendingEffects.length > 0 ? (...) : ( <HomeEmptyState /> )`. (Если HomeEmptyState нет, просто div с текстом).

2. **Кнопки быстрого доступа:**
   - Сделай их еще компактнее по высоте.
   - Уменьши паддинги: `p-3`.
   - Иконку и текст поставь плотнее.

**Вот обновленный фрагмент JSX для кнопок (замени секцию grid c кнопками):**

```tsx
            {/* QUICK ACTIONS (SUPER COMPACT) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => redirectToRandomEffect()} className="group relative px-4 py-3 bg-darkCard border border-light/10 rounded-xl hover:border-purple-500/50 transition-all overflow-hidden flex items-center gap-3 shadow-lg">
                    <div className="absolute top-0 right-0 p-8 bg-purple-500/10 blur-2xl rounded-full -mr-4 -mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-purple-500/20 transition-colors shrink-0">
                        <Shuffle className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left flex-1">
                        <h3 className="font-bold text-white text-sm leading-tight">Случайный сбой</h3>
                        <p className="text-[10px] text-light/50">Испытай удачу</p>
                    </div>
                </button>

                <Link href="/quiz" className="group relative px-4 py-3 bg-darkCard border border-light/10 rounded-xl hover:border-cyan-500/50 transition-all overflow-hidden flex items-center gap-3 shadow-lg">
                    <div className="absolute top-0 right-0 p-8 bg-cyan-500/10 blur-2xl rounded-full -mr-4 -mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-cyan-500/20 transition-colors shrink-0">
                        <BrainCircuit className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="text-left flex-1">
                        <h3 className="font-bold text-white text-sm leading-tight">Тест памяти</h3>
                        <p className="text-[10px] text-light/50">Проверка реальности</p>
                    </div>
                </Link>

                <Link href="/catalog" className="group relative px-4 py-3 bg-darkCard border border-light/10 rounded-xl hover:border-green-500/50 transition-all overflow-hidden flex items-center gap-3 shadow-lg">
                    <div className="absolute top-0 right-0 p-8 bg-green-500/10 blur-2xl rounded-full -mr-4 -mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-green-500/20 transition-colors shrink-0">
                        <Database className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-left flex-1">
                        <h3 className="font-bold text-white text-sm leading-tight">Полный архив</h3>
                        <p className="text-[10px] text-light/50">Вся база данных</p>
                    </div>
                </Link>
            </div>
Обновленный фрагмент для списков эффектов (замени секции Trending и New):

code
Tsx
{/* 3. TRENDING */}
        <section>
            <div className="flex items-end justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Flame className="w-6 h-6 text-orange-500" /> В тренде
                </h2>
                <Link href="/catalog?sort=popular" className="hidden md:flex text-xs font-bold text-light/40 hover:text-white transition-colors items-center gap-1">
                    ПОКАЗАТЬ ВСЕ <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
            
            {trendingEffects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingEffects.map((effect, i) => (
                        <EffectCard key={effect.id} {...effect} badge={`#${i + 1}`} priority={i < 3} hasVoted={votedEffectIds.includes(effect.id)} showProgress={votedEffectIds.includes(effect.id)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border border-dashed border-light/10 rounded-2xl bg-white/5">
                    <p className="text-light/40">Данные загружаются или отсутствуют...</p>
                </div>
            )}
        </section>

        {/* 4. NEW DISCOVERIES */}
        <section className="pt-8 border-t border-light/5">
             <div className="flex items-center justify-center mb-8">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                     <SparklesIcon className="w-6 h-6 text-yellow-400" /> Новые обнаружения
                 </h2>
             </div>
             
             {newEffects.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {newEffects.map((effect) => (
                        <EffectCard key={effect.id} {...effect} badge="Новое" hasVoted={votedEffectIds.includes(effect.id)} />
                    ))}
                 </div>
             ) : (
                 <div className="text-center py-12 text-light/30">База данных пуста или недоступна</div>
             )}

             <div className="text-center">
                 <Link href="/catalog?sort=newest" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-light transition-colors text-sm font-medium">
                     Смотреть все поступления <ArrowRight className="w-4 h-4" />
                 </Link>
             </div>
        </section>