# 🌳 Структура проекта Project_002

```
Project_002/
│
├── 📁 .cursor/                          # Конфигурация Cursor AI
│   ├── index.mdc                        # Главный индекс правил
│   ├── BEST_PRACTICES_SUMMARY.md
│   ├── CHECKLIST_STATUS.md
│   ├── CURSOR_PREVIEW_FIX.md
│   ├── FILE_REORGANIZATION_REPORT.md
│   ├── FILE_SAVE_CONFLICT_FIX.md
│   ├── FILESYSTEM_FIX.md
│   ├── LANGFUSE_QUICK_START.md
│   ├── LANGFUSE_TROUBLESHOOTING.md
│   ├── LEVEL1_TEMPLATE.md
│   ├── MANUAL_ACTIONS.md
│   ├── MCP_*.md                         # MCP документация
│   ├── PROMPT_ENGINEER_*.md
│   ├── RULES_ARCHITECTURE.md
│   └── 📁 rules/                        # Правила проекта
│       ├── 000-core.mdc                 # Базовые принципы
│       ├── 001-project-orchestrator.mdc # DEPRECATED
│       ├── framer-motion-patterns.mdc
│       ├── lessons-learned.mdc          # Накопленные уроки
│       ├── react-patterns.mdc
│       ├── recharts-patterns.mdc
│       ├── zustand-stores.mdc
│       ├── 📁 agents/                   # Агенты для разных задач
│       │   ├── backend-agent.mdc
│       │   ├── frontend-agent.mdc
│       │   └── testing-agent.mdc
│       ├── 📁 templates/                # Шаблоны
│       │   └── feature-template.mdc
│       └── 📁 workflows/                 # Workflows
│           ├── code-review.mdc
│           ├── deployment.mdc
│           ├── errors-and-solutions.mdc
│           ├── feature-development.mdc
│           ├── performance-optimization.mdc
│           └── planning.mdc
│
├── 📁 app/                              # Next.js App Router
│   ├── layout.tsx                       # Главный layout
│   ├── page.tsx                         # Главная страница
│   ├── template.tsx                     # Template для transitions
│   ├── globals.css                      # Глобальные стили
│   ├── favicon.ico
│   ├── sitemap.ts                       # Sitemap генератор
│   ├── HomeClient.tsx                   # Клиентский компонент главной
│   │
│   ├── 📁 actions/                      # Server Actions
│   │   ├── admin.ts                     # Админские действия
│   │   ├── category.ts                  # Категории
│   │   ├── effects.ts                   # Эффекты
│   │   ├── find-new-effects.ts          # Поиск новых эффектов (AI)
│   │   ├── generate-content.ts           # Генерация контента (AI)
│   │   ├── recalculate-votes.ts         # Пересчет голосов
│   │   ├── submission.ts                 # Отправка эффектов
│   │   ├── votes.ts                      # Голосование
│   │   └── voting.ts
│   │
│   ├── 📁 admin/                        # Админ-панель
│   │   ├── page.tsx
│   │   ├── AdminClient.tsx               # Клиентский компонент админки
│   │   └── LoginForm.tsx
│   │
│   ├── 📁 catalog/                      # Каталог эффектов
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── CatalogClient.tsx
│   │
│   ├── 📁 effect/                       # Страница эффекта
│   │   └── 📁 [id]/
│   │       ├── page.tsx
│   │       ├── layout.tsx
│   │       └── EffectClient.tsx
│   │
│   ├── 📁 quiz/                         # Квиз
│   │   ├── page.tsx
│   │   └── QuizClient.tsx
│   │
│   ├── 📁 my-memory/                    # Моя память (статистика)
│   │   ├── page.tsx
│   │   └── layout.tsx
│   │
│   ├── 📁 stats/                        # Статистика
│   │   ├── page.tsx
│   │   └── layout.tsx
│   │
│   ├── 📁 submit/                       # Отправка эффекта
│   │   ├── page.tsx
│   │   └── layout.tsx
│   │
│   ├── 📁 about/                        # О проекте
│   │   └── page.tsx
│   │
│   └── 📁 how-it-works/                 # Как это работает
│       └── page.tsx
│
├── 📁 components/                       # React компоненты
│   ├── EffectCard.tsx                   # Карточка эффекта
│   ├── Header.tsx                       # Шапка сайта
│   ├── Footer.tsx                       # Подвал
│   ├── Loading.tsx                      # Загрузка
│   ├── LoadingSpinner.tsx
│   ├── Skeleton.tsx                     # Скелетон загрузки
│   ├── EmptyState.tsx                   # Пустое состояние
│   ├── ErrorState.tsx                   # Состояние ошибки
│   ├── ScrollToTop.tsx                  # Кнопка наверх
│   ├── SaveProgress.tsx                 # Сохранение прогресса
│   ├── PageTransition.tsx               # Переходы страниц
│   ├── FadeIn.tsx                       # Fade-in анимация
│   ├── AccordionButton.tsx
│   ├── AnimatedCounter.tsx              # Анимированный счетчик
│   ├── DonutChart.tsx                   # Круговая диаграмма
│   │
│   ├── 📁 admin/                        # Админские компоненты
│   │   ├── EffectCard.tsx
│   │   └── LoginForm.tsx
│   │
│   └── 📁 ui/                           # UI компоненты
│       ├── ImageWithSkeleton.tsx         # Изображение со скелетоном
│       ├── GlitchTitle.tsx               # Заголовок с глитч-эффектом
│       ├── SoundToggle.tsx               # Переключатель звука
│       ├── CustomSelect.tsx              # Кастомный select
│       ├── EmojiPickerInput.tsx          # Поле выбора эмодзи
│       └── Toggle.tsx                    # Переключатель
│
├── 📁 lib/                              # Утилиты и хелперы
│   ├── prisma.ts                        # Prisma клиент
│   ├── constants.ts                      # Константы
│   ├── visitor.ts                       # Трекинг посетителей
│   │
│   ├── 📁 hooks/                        # React хуки
│   │   ├── useSound.ts                  # Звуковые эффекты
│   │   ├── useCountUp.ts                # Счетчик с анимацией
│   │   ├── useDebounce.ts               # Debounce
│   │   ├── useThrottle.ts               # Throttle
│   │   └── useInView.ts                 # Intersection Observer
│   │
│   └── 📁 utils/                        # Утилиты
│       └── localStorage.ts              # Работа с localStorage
│
├── 📁 prisma/                           # Prisma ORM
│   ├── schema.prisma                    # Схема БД
│   ├── seed.ts                          # Сидер данных
│   └── seed-submissions.ts              # Сидер отправок
│
├── 📁 public/                           # Статические файлы
│   ├── robots.txt
│   ├── sw.js                            # Service Worker
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── 📁 scripts/                          # Скрипты
│   ├── agent-enforcer.js                # Enforcer для агентов
│   ├── enforcer-to-beads.js            # Синхронизация с Beads
│   ├── install-beads.ps1                # Установка Beads
│   ├── quality-check-modified.js        # Проверка качества
│   ├── remove-duplicates.ts            # Удаление дублей
│   ├── restore-full-data.ts            # Восстановление данных
│   └── sync-enforcer-rules.js          # Синхронизация правил
│
├── 📁 docs/                             # Документация
│   ├── effect.md                        # Glitch эффекты
│   ├── tuning.md                        # Настройки
│   ├── Concepte.md
│   ├── Concepte.txt
│   └── *.txt                            # Различные заметки
│
├── 📁 api_backup/                       # Бэкап старых API routes
│   ├── 📁 admin/
│   ├── 📁 categories/
│   ├── 📁 effect/
│   ├── 📁 effects/
│   └── ...
│
├── 📁 backups/                          # Бэкапы данных
│   ├── 📁 data/
│   │   ├── effects.json
│   │   ├── pending-effects.json
│   │   ├── rate-limits.json
│   │   └── submissions.json
│   └── *.zip                            # Архивы бэкапов
│
├── 📁 for_gemini/                       # Файлы для Gemini
│
├── 📁 src/                              # Тестовые файлы
│   └── test-example.js
│
├── 📄 package.json                      # Зависимости
├── 📄 package-lock.json
├── 📄 tsconfig.json                     # TypeScript конфиг
├── 📄 next.config.ts                    # Next.js конфиг
├── 📄 tailwind.config.ts                # Tailwind конфиг
├── 📄 postcss.config.js                 # PostCSS конфиг
├── 📄 eslint.config.mjs                 # ESLint конфиг
├── 📄 next-env.d.ts                     # Next.js типы
├── 📄 README.md                         # Описание проекта
├── 📄 QUICK_START.md                    # Быстрый старт
├── 📄 restore.json                      # Восстановление
└── 📄 npm.dm                            # npm команды
```

## 📊 Основные технологии

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS, Framer Motion
- **Database:** Prisma ORM (PostgreSQL)
- **AI:** OpenAI, Google Gemini, OpenRouter
- **Charts:** Recharts
- **Icons:** Emoji Picker
- **Notifications:** React Hot Toast

## 🎯 Ключевые особенности

1. **Server Actions** - все API через Server Actions
2. **AI Integration** - генерация контента через AI
3. **Real-time Updates** - обновления без перезагрузки
4. **Responsive Design** - адаптивный дизайн
5. **Performance** - оптимизация производительности
6. **Accessibility** - доступность (a11y)

## 📝 Важные файлы

- `app/globals.css` - глобальные стили, глитч-эффекты
- `components/EffectCard.tsx` - карточка эффекта
- `app/actions/generate-content.ts` - генерация через AI
- `prisma/schema.prisma` - схема базы данных
- `.cursor/rules/` - правила для AI ассистента

