import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-dark border-t border-darkCard py-12 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Колонка 1: О проекте */}
          <div>
            <h3 className="text-lg font-semibold text-light mb-4">О проекте</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-light/80 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-primary hover:to-secondary transition-all duration-300"
                >
                  Что это?
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-light/80 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-primary hover:to-secondary transition-all duration-300"
                >
                  Как это работает?
                </Link>
              </li>
            </ul>
          </div>

          {/* Колонка 2: Навигация */}
          <div>
            <h3 className="text-lg font-semibold text-light mb-4">Навигация</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-light/80 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-primary hover:to-secondary transition-all duration-300"
                >
                  Главная
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog"
                  className="text-light/80 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-primary hover:to-secondary transition-all duration-300"
                >
                  Каталог
                </Link>
              </li>
              <li>
                <Link
                  href="/submit"
                  className="text-light/80 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-primary hover:to-secondary transition-all duration-300"
                >
                  Добавить эффект
                </Link>
              </li>
              <li>
                <Link
                  href="/stats"
                  className="text-light/80 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-primary hover:to-secondary transition-all duration-300"
                >
                  Статистика
                </Link>
              </li>
            </ul>
          </div>

          {/* Колонка 3: Контакты */}
          <div>
            <h3 className="text-lg font-semibold text-light mb-4">Контакты</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-light/80 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-primary hover:to-secondary transition-all duration-300"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@example.com"
                  className="text-light/80 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-primary hover:to-secondary transition-all duration-300"
                >
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Копирайт */}
        <div className="text-center text-light/60 pt-8 border-t border-darkCard">
          <p>Создано с ❤️ • 2025</p>
        </div>
      </div>
    </footer>
  );
}

