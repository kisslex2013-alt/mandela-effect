# Структура проекта "Эффект Манделы"

```
Project_002/
│
├── app/                          # Next.js App Router
│   ├── actions/                  # Server Actions
│   │   ├── admin.ts
│   │   ├── category.ts
│   │   ├── effects.ts            # Основные действия с эффектами
│   │   ├── find-new-effects.ts
│   │   ├── generate-content.ts
│   │   ├── generate-identity.ts
│   │   ├── recalculate-votes.ts
│   │   ├── submission.ts
│   │   ├── votes.ts
│   │   └── voting.ts
│   │
│   ├── admin/                    # Админ-панель
│   │   ├── AdminClient.tsx
│   │   ├── LoginForm.tsx
│   │   └── page.tsx
│   │
│   ├── catalog/                  # Каталог эффектов
│   │   ├── CatalogClient.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── effect/[id]/              # Страница эффекта
│   │   ├── EffectClient.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── my-memory/                # Личная статистика
│   │   ├── IdentityClient.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── quiz/                     # Квиз
│   │   ├── QuizClient.tsx
│   │   └── page.tsx
│   │
│   ├── stats/                    # Статистика
│   │   ├── StatsClient.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── submit/                   # Отправка эффекта
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── share/[id]/               # Поделиться эффектом
│   │   └── page.tsx
│   │
│   ├── about/                    # О проекте
│   │   └── page.tsx
│   │
│   ├── how-it-works/            # Как это работает
│   │   └── page.tsx
│   │
│   ├── HomeClient.tsx            # Главная страница (клиент)
│   ├── layout.tsx                # Корневой layout
│   ├── page.tsx                  # Главная страница (сервер)
│   ├── template.tsx
│   ├── globals.css
│   ├── favicon.ico
│   └── sitemap.ts
│
├── components/                   # React компоненты
│   ├── admin/
│   │   ├── EffectCard.tsx
│   │   └── LoginForm.tsx
│   │
│   ├── ui/                       # UI компоненты
│   │   ├── CustomSelect.tsx
│   │   ├── EmojiPickerInput.tsx
│   │   ├── GlitchTitle.tsx
│   │   ├── ImageWithSkeleton.tsx
│   │   ├── SoundToggle.tsx
│   │   └── Toggle.tsx
│   │
│   ├── AccordionButton.tsx
│   ├── AnimatedCounter.tsx
│   ├── DonutChart.tsx
│   ├── EffectCard.tsx           # Карточка эффекта
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   ├── FadeIn.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── Loading.tsx
│   ├── LoadingSpinner.tsx
│   ├── PageTransition.tsx
│   ├── SaveProgress.tsx
│   ├── ScrollToTop.tsx
│   └── Skeleton.tsx
│
├── lib/                          # Утилиты и библиотеки
│   ├── hooks/                    # React хуки
│   │   ├── useCountUp.ts
│   │   ├── useDebounce.ts
│   │   ├── useInView.ts
│   │   ├── useSound.ts
│   │   └── useThrottle.ts
│   │
│   ├── utils/
│   │   └── localStorage.ts
│   │
│   ├── constants.ts              # Константы проекта
│   ├── prisma.ts                 # Prisma клиент
│   ├── visitor.ts                # Утилиты для посетителей
│   └── votes-store.ts            # Хранилище голосов
│
├── prisma/                       # Prisma ORM
│   ├── schema.prisma             # Схема базы данных
│   ├── seed.ts                   # Сид данных
│   └── seed-submissions.ts
│
├── .cursor/                      # Правила и конфигурация Cursor
│   ├── rules/
│   │   ├── 000-core.mdc         # Базовые принципы
│   │   ├── 001-project-orchestrator.mdc
│   │   ├── agents/               # Агенты
│   │   │   ├── backend-agent.mdc
│   │   │   ├── frontend-agent.mdc
│   │   │   └── testing-agent.mdc
│   │   ├── workflows/            # Workflows
│   │   │   ├── code-review.mdc
│   │   │   ├── deployment.mdc
│   │   │   ├── errors-and-solutions.mdc
│   │   │   ├── feature-development.mdc
│   │   │   ├── performance-optimization.mdc
│   │   │   └── planning.mdc
│   │   ├── templates/
│   │   │   └── feature-template.mdc
│   │   ├── framer-motion-patterns.mdc
│   │   ├── lessons-learned.mdc
│   │   ├── react-patterns.mdc
│   │   ├── recharts-patterns.mdc
│   │   └── zustand-stores.mdc
│   │
│   └── [другие конфигурационные файлы]
│
├── public/                       # Статические файлы
│   ├── robots.txt
│   ├── sw.js                     # Service Worker
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── scripts/                      # Скрипты
│   ├── agent-enforcer.js
│   ├── enforcer-to-beads.js
│   ├── install-beads.ps1
│   ├── quality-check-modified.js
│   ├── remove-duplicates.ts
│   ├── restore-full-data.ts
│   ├── sync-enforcer-rules.js
│   └── test-identity-votes.js
│
├── docs/                         # Документация
│   ├── PROJECT_STRUCTURE.md
│   ├── concept-multimedia.md
│   ├── effect.md
│   ├── last.md
│   ├── sdvig.md
│   ├── test-identity.md
│   ├── tuning.md
│   └── [другие .txt и .md файлы]
│
├── api_backup/                   # Резервные копии API routes
│   ├── admin/
│   ├── categories/
│   ├── effect/
│   ├── effects/
│   ├── most-controversial/
│   ├── random-effect/
│   ├── stats/
│   ├── submit/
│   └── vote/
│
├── backups/                      # Резервные копии
│   └── data/
│
├── node_modules/                 # Зависимости
│
├── .env                          # Переменные окружения (не в git)
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── QUICK_START.md
└── README.md
```

## Основные директории:

### `app/` - Next.js App Router
- **actions/** - Server Actions для работы с данными
- **admin/** - Админ-панель
- **catalog/** - Каталог эффектов
- **effect/[id]/** - Страница отдельного эффекта
- **my-memory/** - Личная статистика пользователя
- **quiz/** - Квиз для проверки памяти
- **stats/** - Глобальная статистика
- **submit/** - Форма отправки эффекта

### `components/` - React компоненты
- **ui/** - Переиспользуемые UI компоненты
- **admin/** - Компоненты для админ-панели
- Основные компоненты: EffectCard, Header, Footer и др.

### `lib/` - Утилиты
- **hooks/** - Кастомные React хуки
- **utils/** - Вспомогательные функции
- Константы, Prisma клиент, хранилище голосов

### `prisma/` - База данных
- **schema.prisma** - Схема БД
- Скрипты для сидирования данных

### `.cursor/rules/` - Правила разработки
- **agents/** - Агенты для разных задач
- **workflows/** - Процессы разработки
- Паттерны и лучшие практики

