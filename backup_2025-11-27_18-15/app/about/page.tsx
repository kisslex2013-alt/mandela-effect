import Link from 'next/link';
import PageTransition from '@/components/PageTransition';

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-dark pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-8">
            Что такое Эффект Манделы?
          </h1>
          
          <div className="prose prose-invert max-w-none text-light/80 space-y-6 text-lg">
            <p>
              Эффект Манделы — это феномен возникновения совпадения у нескольких людей воспоминаний, 
              противоречащих реальным фактам.
            </p>
            
            <p>
              Феномен назван в честь <strong className="text-light">Нельсона Манделы</strong>. 
              Многие люди были уверены, что он умер в тюрьме в 1980-х годах, хотя на самом деле 
              он вышел на свободу в 1990 году и стал президентом ЮАР. Он умер только в 2013 году.
            </p>

            <div className="bg-darkCard rounded-2xl p-6 border border-light/10 my-8">
              <h2 className="text-2xl font-bold text-light mb-4">🧠 Почему это происходит?</h2>
              <ul className="space-y-3 text-light/70">
                <li className="flex items-start gap-3">
                  <span className="text-primary">•</span>
                  <span><strong className="text-light">Конфабуляция</strong> — мозг заполняет пробелы в памяти логичными, но неверными деталями</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary">•</span>
                  <span><strong className="text-light">Социальное влияние</strong> — мы склонны принимать воспоминания других как свои</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary">•</span>
                  <span><strong className="text-light">Схематическая память</strong> — мы запоминаем общую идею, а не точные детали</span>
                </li>
              </ul>
            </div>

            <div className="bg-darkCard rounded-2xl p-6 border border-light/10 my-8">
              <h2 className="text-2xl font-bold text-light mb-4">📋 Известные примеры</h2>
              <ul className="space-y-3 text-light/70">
                <li className="flex items-start gap-3">
                  <span className="text-secondary">•</span>
                  <span><strong className="text-light">Berenstain Bears</strong> — многие помнят &quot;Berenstein&quot;, хотя всегда было &quot;Berenstain&quot;</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary">•</span>
                  <span><strong className="text-light">Дарт Вейдер</strong> — &quot;Luke, I am your father&quot; vs &quot;No, I am your father&quot;</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary">•</span>
                  <span><strong className="text-light">Монополия</strong> — многие помнят монокль у мистера Монополи, которого никогда не было</span>
                </li>
              </ul>
            </div>

            <p>
              На нашем сайте вы можете исследовать сотни эффектов Манделы, проголосовать за свой вариант 
              воспоминания и узнать, как помнят другие люди.
            </p>
          </div>
          
          <div className="mt-12">
            <Link 
              href="/catalog" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
            >
              <span>Исследовать каталог</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
