import Link from 'next/link';
import PageTransition from '@/components/PageTransition';

export default function HowItWorksPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-dark pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-secondary to-primary mb-8">
            Как это работает?
          </h1>
          
          <p className="text-xl text-light/70 mb-12">
            Три простых шага, чтобы исследовать феномен коллективной памяти
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Шаг 1 */}
            <div className="bg-darkCard p-6 rounded-2xl border border-light/10 hover:border-light/20 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <span className="text-3xl">🗳️</span>
              </div>
              <div className="text-sm font-bold text-primary mb-2">Шаг 01</div>
              <h3 className="text-xl font-bold mb-3 text-light">Голосуйте</h3>
              <p className="text-light/60">
                Выбирайте вариант, который помните именно вы. Здесь нет правильных ответов — доверьтесь своей памяти.
              </p>
            </div>

            {/* Шаг 2 */}
            <div className="bg-darkCard p-6 rounded-2xl border border-light/10 hover:border-light/20 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <div className="text-sm font-bold text-purple-400 mb-2">Шаг 02</div>
              <h3 className="text-xl font-bold mb-3 text-light">Изучайте</h3>
              <p className="text-light/60">
                После голосования вы увидите статистику. Узнайте, совпадает ли ваша память с большинством.
              </p>
            </div>

            {/* Шаг 3 */}
            <div className="bg-darkCard p-6 rounded-2xl border border-light/10 hover:border-light/20 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <div className="text-sm font-bold text-secondary mb-2">Шаг 03</div>
              <h3 className="text-xl font-bold mb-3 text-light">Предлагайте</h3>
              <p className="text-light/60">
                Знаете интересный эффект? Отправьте заявку, и после модерации он появится на сайте.
              </p>
            </div>
          </div>

          {/* Дополнительные возможности */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-light mb-8">Что ещё можно делать?</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-dark/50 rounded-xl p-5 border border-light/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📈</span>
                  <h3 className="text-lg font-semibold text-light">Общая статистика</h3>
                </div>
                <p className="text-light/60 text-sm">
                  Смотрите графики и аналитику: самые спорные эффекты, популярные категории, тренды.
                </p>
              </div>

              <div className="bg-dark/50 rounded-xl p-5 border border-light/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🧠</span>
                  <h3 className="text-lg font-semibold text-light">Моя память</h3>
                </div>
                <p className="text-light/60 text-sm">
                  Отслеживайте свои голоса и узнайте, как часто ваша память совпадает с большинством.
                </p>
              </div>

              <div className="bg-dark/50 rounded-xl p-5 border border-light/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔍</span>
                  <h3 className="text-lg font-semibold text-light">Поиск и фильтры</h3>
                </div>
                <p className="text-light/60 text-sm">
                  Ищите эффекты по названию, фильтруйте по категориям и сортируйте по популярности.
                </p>
              </div>

              <div className="bg-dark/50 rounded-xl p-5 border border-light/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📚</span>
                  <h3 className="text-lg font-semibold text-light">Подробная информация</h3>
                </div>
                <p className="text-light/60 text-sm">
                  Для каждого эффекта — история, научное объяснение и ссылки на источники.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-light mb-4">Готовы начать?</h2>
            <p className="text-light/60 mb-8">Выберите, с чего хотите начать своё исследование</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
              >
                <span>🗳️ Начать голосовать</span>
              </Link>
              <Link
                href="/submit"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-light/10 text-light font-semibold rounded-xl hover:bg-light/20 transition-colors border border-light/20"
              >
                <span>✨ Предложить эффект</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
