'use server';

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Интерфейс для результата генерации
interface GeneratedEffectInfo {
  currentState: string;
  scientific: string;
  community: string;
  history: string;
  residue: string;
  // Ссылки на источники
  sourceLink: string;
  scientificSource: string;
  communitySource: string;
  historySource: string;
  residueSource: string;
  // Категория эффекта
  category?: string;
  // URL изображения
  imageUrl?: string;
  // Промпт для изображения (от AI)
  imagePrompt?: string;
  // Ошибка валидации (если AI считает запрос некорректным)
  error?: string;
}

interface GenerateResult {
  success: boolean;
  data?: GeneratedEffectInfo;
  usedModel?: string;
  error?: string;
}

interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  usedModel?: string;
  error?: string;
}

/**
 * Конфигурация модели с указанием провайдера
 */
interface ModelConfig {
  provider: 'google' | 'groq' | 'cerebras' | 'siliconflow' | 'hyperbolic' | 'openrouter';
  model: string;
}

/**
 * Список провайдеров и моделей для генерации
 * Автоматически переключается между провайдерами при перегрузке
 * Приоритет: Качество → Скорость → Резерв
 */
const PROVIDERS: ModelConfig[] = [
  // 1. Google (База: умный, бесплатно)
  { provider: 'google', model: 'gemini-2.0-flash-exp' },
  
  // 2. Claude 3.5 Sonnet (ТОП качество через OpenRouter)
  { provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet' },
  
  // 3. Perplexity (Доступ к интернету для фактов)
  { provider: 'openrouter', model: 'perplexity/llama-3.1-sonar-large-128k-online' },
  
  // 4. DeepSeek V3 (SOTA уровень через OpenRouter)
  { provider: 'openrouter', model: 'deepseek/deepseek-chat' },
  
  // 5. SiliconFlow (DeepSeek V3 - резерв через прямой API)
  { provider: 'siliconflow', model: 'deepseek-ai/DeepSeek-V3' },

  // 6. Hyperbolic (Llama 405B - Самая умная открытая модель)
  { provider: 'hyperbolic', model: 'meta-llama/Meta-Llama-3.1-405B-Instruct' },

  // 7. Cerebras (Сверхскорость)
  { provider: 'cerebras', model: 'llama3.1-70b' },

  // 8. Groq (Скорость)
  { provider: 'groq', model: 'llama-3.3-70b-versatile' },

  // 9. SiliconFlow Резерв (Qwen 2.5)
  { provider: 'siliconflow', model: 'Qwen/Qwen2.5-72B-Instruct' },
  
  // 10. OpenRouter Резерв (бесплатная модель)
  { provider: 'openrouter', model: 'google/gemini-2.0-flash-lite-preview-02-05:free' },
];

/**
 * "Липкая" модель - запоминаем индекс последней успешной модели/провайдера
 * между вызовами функции generateEffectData
 */
let currentModelIndex = 0;

/**
 * Очищает текст от Markdown-обёрток (```json ... ```)
 * Надёжно извлекает JSON из ответа AI
 */
function cleanJsonResponse(rawText: string): string {
  let text = rawText.trim();
  
  console.log('[cleanJsonResponse] Исходный текст (первые 300 символов):', text.slice(0, 300));
  
  // Способ 1: Регулярка для извлечения JSON из блока ```json ... ```
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    console.log('[cleanJsonResponse] ✅ Найден JSON в markdown блоке');
    text = jsonBlockMatch[1].trim();
  } else {
    // Способ 2: Ручная очистка начала и конца
    if (text.startsWith('```json')) {
      text = text.slice(7);
    } else if (text.startsWith('```')) {
      text = text.slice(3);
    }
    
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
    
    text = text.trim();
  }
  
  // Способ 3: Если текст начинается не с {, пробуем найти первый {
  if (!text.startsWith('{')) {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      console.log('[cleanJsonResponse] ✅ Извлекаем JSON по скобкам { }');
      text = text.slice(firstBrace, lastBrace + 1);
    }
  }
  
  console.log('[cleanJsonResponse] Очищенный текст (первые 300 символов):', text.slice(0, 300));
  
  return text;
}

/**
 * Проверяет, является ли ошибка "перегрузкой" модели (429, 503 и т.д.)
 */
function isRetryableError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMessage.includes('429') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('503') ||
    errorMessage.includes('unavailable') ||
    errorMessage.includes('overloaded') ||
    errorMessage.includes('capacity')
  );
}

/**
 * Генерирует информацию об эффекте Манделы с помощью нескольких провайдеров
 * Автоматически переключается между провайдерами (Google Direct, Groq, OpenRouter) при перегрузке
 * Приоритет: Google → Groq → OpenRouter
 */
export async function generateEffectData(
  title: string,
  question: string,
  variantA: string,
  variantB: string,
  options?: { generateImage?: boolean }
): Promise<GenerateResult> {
  const shouldGenerateImage = options?.generateImage !== false; // По умолчанию true
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('[generateEffectData] 🚀 НАЧАЛО ГЕНЕРАЦИИ (Multi-Provider: Google + SiliconFlow + Cerebras + Groq + Hyperbolic + OpenRouter)');
  console.log('═══════════════════════════════════════════════════════════');
  
  // ШАГ 1: Проверяем наличие хотя бы одного API ключа
  const hasGoogleKey = !!process.env.GOOGLE_API_KEY;
  const hasSiliconFlowKey = !!process.env.SILICONFLOW_API_KEY;
  const hasCerebrasKey = !!process.env.CEREBRAS_API_KEY;
  const hasGroqKey = !!process.env.GROQ_API_KEY;
  const hasHyperbolicKey = !!process.env.HYPERBOLIC_API_KEY;
  const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
  
  console.log('[generateEffectData] Проверка API ключей...');
  console.log('[generateEffectData] GOOGLE_API_KEY существует:', hasGoogleKey);
  console.log('[generateEffectData] SILICONFLOW_API_KEY существует:', hasSiliconFlowKey);
  console.log('[generateEffectData] CEREBRAS_API_KEY существует:', hasCerebrasKey);
  console.log('[generateEffectData] GROQ_API_KEY существует:', hasGroqKey);
  console.log('[generateEffectData] HYPERBOLIC_API_KEY существует:', hasHyperbolicKey);
  console.log('[generateEffectData] OPENROUTER_API_KEY существует:', hasOpenRouterKey);
  
  if (!hasGoogleKey && !hasSiliconFlowKey && !hasCerebrasKey && !hasGroqKey && !hasHyperbolicKey && !hasOpenRouterKey) {
    console.error('');
    console.error('❌ ОШИБКА: API ключ не найден!');
    console.error('Добавьте хотя бы один API ключ в файл .env или .env.local');
    console.error('Доступные провайдеры:');
    console.error('  - Google: https://makersuite.google.com/app/apikey');
    console.error('  - SiliconFlow: https://siliconflow.cn');
    console.error('  - Cerebras: https://cerebras.ai');
    console.error('  - Groq: https://console.groq.com/keys');
    console.error('  - Hyperbolic: https://hyperbolic.xyz');
    console.error('  - OpenRouter: https://openrouter.ai/keys');
    console.error('');
    return {
      success: false,
      error: 'API ключ не настроен. Добавьте хотя бы один API ключ в .env файл.',
    };
  }

  // ШАГ 2: Проверяем входные данные
  console.log('[generateEffectData] Входные данные:');
  console.log('  - title:', title);
  console.log('  - question:', question);
  console.log('  - variantA:', variantA);
  console.log('  - variantB:', variantB);
  
  if (!title || title.trim().length < 3) {
    console.error('[generateEffectData] ❌ Название слишком короткое');
    return {
      success: false,
      error: 'Введите название эффекта (минимум 3 символа)',
    };
  }
  
  if (!variantA || !variantB || variantA.trim().length === 0 || variantB.trim().length === 0) {
    console.error('[generateEffectData] ❌ Варианты A и B обязательны');
    return {
      success: false,
      error: 'Введите оба варианта (A и B)',
    };
  }

  // ШАГ 4: Формируем промт
  const searchQuery = encodeURIComponent(`${title} Mandela effect`);
  
  const systemPrompt = `

🚨 СТРОГАЯ ПРОВЕРКА ВХОДНЫХ ДАННЫХ (ВЫПОЛНИ В ПЕРВУЮ ОЧЕРЕДЬ):

Твоя ПЕРВАЯ и ГЛАВНАЯ задача — проверить запрос (title и question) на адекватность.

КРИТЕРИИ ОШИБКИ (если ЛЮБОЙ из них выполняется — это ошибка):
1. Запрос состоит из общих слов ("название", "эффект", "вопрос", "тест", "test", "string", "привет", "hello", "пример", "example").
2. Запрос бессмысленный ("фывфыв", "asdasd", "qwerty", "йцукен", "ааааа").
3. Запрос не содержит конкретики — непонятно, о каком именно явлении, бренде, фильме или событии идёт речь.
4. Запрос слишком общий ("эффект манделы", "что-то помню", "странное воспоминание").

ДЕЙСТВИЯ ПРИ ОШИБКЕ:
Если запрос попадает под ЛЮБОЙ критерий ошибки, ты ОБЯЗАН вернуть ТОЛЬКО такой JSON:
{ "error": "Непонятный запрос. Введите конкретное название эффекта (например: 'Логотип Volkswagen', 'Фраза из Звездных войн', 'Berenstain Bears')." }

🚫 СТРОГИЕ ЗАПРЕТЫ:
- ЗАПРЕЩЕНО возвращать поля currentState, history, scientific, community, residue если обнаружена ошибка.
- ЗАПРЕЩЕНО писать текст с извинениями ("К сожалению...", "Извините...") в любое поле.
- ЗАПРЕЩЕНО генерировать контент про Нельсона Манделу, если запрос не о нём конкретно.
- Если это не похоже на реальный эффект Манделы — возвращай ТОЛЬКО { "error": "..." }.

✅ ЕСЛИ ЗАПРОС ВАЛИДНЫЙ:
Только если запрос содержит конкретное название (бренд, фильм, цитату, событие) — генерируй полный ответ.

---

ТЫ — ГЕНЕРАТОР JSON ДЛЯ БАЗЫ ДАННЫХ ЭФФЕКТОВ МАНДЕЛЫ.

Твоя задача: на основе готовых вариантов (variantA и variantB) сгенерировать структурированные данные.

ПРАВИЛА ГЕНЕРАЦИИ JSON:

1. Ты должен вернуть ТОЛЬКО валидный JSON объект.

2. Никакого Markdown (без \`\`\`json).

3. Язык текстовых полей: Русский 🇷🇺.

4. Язык поисковых запросов в ссылках: Английский 🇺🇸 (для лучшего поиска).

ВАЖНО: Варианты A и B уже предоставлены пользователем. Твоя задача — проанализировать разницу между ними и на основе этого сгенерировать описание, историю, научное объяснение и примеры остатков.

ПРАВИЛА ДЛЯ ПОЛЯ residue (ОСТАТКИ):

- ЗАПРЕЩЕНО писать: "в различных источниках", "во многих пародиях", "в интернете", "в поп-культуре", "можно увидеть в мемах", "встречается в разных местах".

- ОБЯЗАТЕЛЬНО приводить конкретику:

  - Если фильм -> Название + Год (например: "В фильме 'История игрушек 2' (1999)...").

  - Если сериал -> Название + Номер сезона/серии или описание сцены (например: "В эпизоде 'Симпсоны' S15E10...").

  - Если видео/интервью -> Кто сказал, где и когда (например: "В интервью 2010 года Джеймс Эрл Джонс...").

  - Если товар -> Описание старой упаковки или конкретного продукта (например: "На упаковке Kit-Kat 1990-х годов...").

- Если конкретных примеров (residue) нет, так и напиши: "Конкретных культурных остатков не найдено".

- Текст должен выглядеть как список фактов с названиями и контекстом.

СТРУКТУРА ОТВЕТА (JSON):

ВАЖНО: НЕ включай поля variantA и variantB в ответ, так как они уже предоставлены пользователем.

Твоя задача:
1. Проанализировать разницу между Вариантом А и Вариантом Б.
2. На основе этого написать описание, историю, научное объяснение и примеры остатков.
3. Подобрать категорию.
4. Сгенерировать поисковые ссылки.
5. Сгенерировать imagePrompt (на АНГЛИЙСКОМ языке):

   ГЛАВНОЕ ПРАВИЛО: Картинка должна иллюстрировать **ЭФФЕКТ МАНДЕЛЫ (Ложное воспоминание/Вариант А)**, а не реальность.

   - Если речь про Пикачу с черным хвостом -> Опиши Пикачу ИМЕННО с черным кончиком хвоста ("Pikachu with black tip on tail").

   - Если речь про Монополию с моноклем -> Опиши человечка С МОНОКЛЕМ ("Monopoly man wearing a monocle").

   - Если речь про Fruit of the Loom -> Опиши рог изобилия ("Fruit of the loom cornucopia logo").

   Твоя задача — визуализировать то, как люди НЕПРАВИЛЬНО помнят этот объект. Мы хотим показать "фантом".

   ПРАВИЛА ДЛЯ ТИПОВ (остаются прежними):

   - Визуал: Крупный план детали из "Варианта А".

   - Текст: Атмосферное фото предмета (без попыток написать текст).

   - Аудио: Сцена с исполнителем.

   Стиль: "cinematic lighting, hyperrealistic, 4k, no text".

{
  "category": "одна из: films, brands, music, popculture, childhood, people, geography, russian, other",
  "currentState": "Подробное описание факта (2 предложения).",
  "scientific": "Научное объяснение...",
  "community": "Мнение сообщества...",
  "history": "История появления...",
  "residue": "Найди минимум 2 КОНКРЕТНЫХ примера (Симпсоны, Джеймс Эрл Джонс, старая реклама). Укажи названия и контекст. Текст должен выглядеть как список фактов. Пример: 'В мультсериале История игрушек 2 (1999) Базз Лайтер говорит именно Нет, я твой отец. В эпизоде Симпсонов S15E10 пародируется именно эта фраза.'",
  "sourceLink": "...",
  "scientificSource": "...",
  "communitySource": "...",
  "historySource": "...",
  "residueSource": "...",
  "imagePrompt": "Close up shot of [описание сцены], cinematic lighting, hyperrealistic, high detail, 4k, no text"
}

ГЕНЕРАЦИЯ ССЫЛОК:

- Не используй общие ссылки (google.com).

- Генерируй точные поисковые запросы, включающие название эффекта и ключевые детали (residue, proof, debunked).

- Для residueSource: Ссылка должна вести на Google Search с перечислением НАЙДЕННЫХ тобой конкретных примеров (например: "Simpsons Luke I am your father parody residue" или "Toy Story 2 No I am your father residue evidence").

`;

  const userPrompt = `

ОБЪЕКТ АНАЛИЗА: "${title}"

ВОПРОС: "${question || 'В чем суть эффекта?'}"

ВАРИАНТ А (Ложное воспоминание/Миф): "${variantA}"

ВАРИАНТ Б (Реальный факт): "${variantB}"

Твоя задача:

1. Проанализировать разницу между Вариантом А и Вариантом Б.

2. На основе этого написать:

   - Подробное описание текущего состояния (факты).

   - Историю появления мифа.

   - Научное объяснение (почему путают А и Б).

   - Примеры культурных остатков (residue) для Варианта А.

3. Подобрать категорию.

4. Сгенерировать поисковые ссылки.

5. Сгенерировать imagePrompt (на АНГЛИЙСКОМ языке):

   ГЛАВНОЕ ПРАВИЛО: Картинка должна иллюстрировать **ЭФФЕКТ МАНДЕЛЫ (Ложное воспоминание/Вариант А)**, а не реальность.

   - Если речь про Пикачу с черным хвостом -> Опиши Пикачу ИМЕННО с черным кончиком хвоста ("Pikachu with black tip on tail").

   - Если речь про Монополию с моноклем -> Опиши человечка С МОНОКЛЕМ ("Monopoly man wearing a monocle").

   - Если речь про Fruit of the Loom -> Опиши рог изобилия ("Fruit of the loom cornucopia logo").

   Твоя задача — визуализировать то, как люди НЕПРАВИЛЬНО помнят этот объект. Мы хотим показать "фантом".

   ПРАВИЛА ДЛЯ ЛЮДЕЙ (особенно РУССКИХ персонажей - КРИТИЧНО для узнаваемости):
   
   - Укажи ИМЯ и ФАМИЛИЮ полностью на английском (Boris Yeltsin, Mikhail Gorbachev)
   - Добавь возраст и описание лица (elderly man 65-70 years old, round face, prominent nose)
   - Опиши цвет волос и прическу (white hair combed to sides, grey hair, bald)
   - Опиши национальность и роль (Russian president, Soviet leader, Russian politician)
   - Опиши характерные черты лица ДЕТАЛЬНО (tired expression, distinctive red birthmark on forehead, blue eyes)
   - Опиши одежду (wearing dark suit, red tie, white shirt)
   - Опиши контекст (giving New Year speech 1999, at press conference, official portrait)
   - ОБЯЗАТЕЛЬНО добавь в конце: "professional photograph, high detail, 4k, photorealistic, recognizable face"

   ПРАВИЛА ДЛЯ ТИПОВ:

   - Визуал: Крупный план детали из "Варианта А".

   - Текст: Атмосферное фото предмета (без попыток написать текст).

   - Аудио: Сцена с исполнителем.

   Стиль по умолчанию: "cinematic lighting, hyperrealistic, 4k, no text".

Пиши на русском языке. Ссылки генерируй поисковые на английском. imagePrompt должен быть на английском.

ВЕРНИ JSON (без полей variantA/variantB, так как они у нас уже есть):

{
  "category": "одна из: films, brands, music, popculture, childhood, people, geography, russian, other",
  "currentState": "Подробное описание факта (2 предложения).",
  "scientific": "Научное объяснение...",
  "community": "Мнение сообщества...",
  "history": "История появления...",
  "residue": "Найди минимум 2 КОНКРЕТНЫХ примера (Симпсоны, Джеймс Эрл Джонс, старая реклама). Укажи названия и контекст. Текст должен выглядеть как список фактов. Пример: 'В мультсериале История игрушек 2 (1999) Базз Лайтер говорит именно Нет, я твой отец. В эпизоде Симпсонов S15E10 пародируется именно эта фраза.'",
  "sourceLink": "https://www.google.com/search?q=...",
  "scientificSource": "https://www.google.com/search?q=...",
  "communitySource": "https://www.google.com/search?q=...",
  "historySource": "https://www.google.com/search?q=...",
  "residueSource": "https://www.google.com/search?q=...",
  "imagePrompt": "Close up shot of [описание сцены], cinematic lighting, hyperrealistic, high detail, 4k, no text"
}

`;

  console.log('[generateEffectData] 📤 ПРОМТ ПОДГОТОВЛЕН');
  console.log('───────────────────────────────────────────────────────────');
  console.log('User prompt:', userPrompt.slice(0, 200) + '...');
  console.log('───────────────────────────────────────────────────────────');

  // ШАГ 5: Цикл попыток с разными провайдерами и моделями (Fallback)
  console.log('');
  console.log('[generateEffectData] 🔄 ЗАПУСК ЦИКЛА MULTI-PROVIDER FALLBACK');
  console.log(`[generateEffectData] Доступно ${PROVIDERS.length} конфигураций для попыток`);
  console.log('');

  const failedModels: string[] = [];
  let lastError: unknown = null;

  // Цикл с "липкой" моделью - начинаем с последней успешной
  const startConfig = PROVIDERS[currentModelIndex];
  console.log(`[generateEffectData] 🎯 Начинаем с конфигурации #${currentModelIndex}: ${startConfig.provider}/${startConfig.model}`);
  
  for (let i = 0; i < PROVIDERS.length; i++) {
    // Вычисляем индекс с учетом смещения (идём по кругу от последней успешной)
    const modelIndex = (currentModelIndex + i) % PROVIDERS.length;
    const config = PROVIDERS[modelIndex];
    
    console.log(`[generateEffectData] 🔄 Пробуем [${modelIndex}]: ${config.provider}/${config.model}...`);
    
    // Проверяем наличие API ключа для провайдера
    if (config.provider === 'google' && !process.env.GOOGLE_API_KEY) {
      console.warn(`[generateEffectData] ⚠️ Пропускаем Google: GOOGLE_API_KEY не настроен`);
      failedModels.push(`${config.provider}/${config.model}`);
      continue;
    }
    
    if (config.provider === 'siliconflow' && !process.env.SILICONFLOW_API_KEY) {
      console.warn(`[generateEffectData] ⚠️ Пропускаем SiliconFlow: SILICONFLOW_API_KEY не настроен`);
      failedModels.push(`${config.provider}/${config.model}`);
      continue;
    }
    
    if (config.provider === 'cerebras' && !process.env.CEREBRAS_API_KEY) {
      console.warn(`[generateEffectData] ⚠️ Пропускаем Cerebras: CEREBRAS_API_KEY не настроен`);
      failedModels.push(`${config.provider}/${config.model}`);
      continue;
    }
    
    if (config.provider === 'groq' && !process.env.GROQ_API_KEY) {
      console.warn(`[generateEffectData] ⚠️ Пропускаем Groq: GROQ_API_KEY не настроен`);
      failedModels.push(`${config.provider}/${config.model}`);
      continue;
    }
    
    if (config.provider === 'hyperbolic' && !process.env.HYPERBOLIC_API_KEY) {
      console.warn(`[generateEffectData] ⚠️ Пропускаем Hyperbolic: HYPERBOLIC_API_KEY не настроен`);
      failedModels.push(`${config.provider}/${config.model}`);
      continue;
    }
    
    if (config.provider === 'openrouter' && !process.env.OPENROUTER_API_KEY) {
      console.warn(`[generateEffectData] ⚠️ Пропускаем OpenRouter: OPENROUTER_API_KEY не настроен`);
      failedModels.push(`${config.provider}/${config.model}`);
      continue;
    }
    
    // Создаем клиент динамически в зависимости от провайдера
    let openai: OpenAI | null = null;
    let googleGenAI: GoogleGenerativeAI | null = null;
    
    if (config.provider === 'google') {
      // Google Gemini через собственный SDK
      googleGenAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    } else if (config.provider === 'siliconflow') {
      // SiliconFlow - OpenAI-совместимый API
      openai = new OpenAI({
        baseURL: 'https://api.siliconflow.cn/v1',
        apiKey: process.env.SILICONFLOW_API_KEY!,
      });
    } else if (config.provider === 'cerebras') {
      // Cerebras - OpenAI-совместимый API
      openai = new OpenAI({
        baseURL: 'https://api.cerebras.ai/v1',
        apiKey: process.env.CEREBRAS_API_KEY!,
      });
    } else if (config.provider === 'groq') {
      openai = new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY!,
      });
    } else if (config.provider === 'hyperbolic') {
      // Hyperbolic - OpenAI-совместимый API
      openai = new OpenAI({
        baseURL: 'https://api.hyperbolic.xyz/v1',
        apiKey: process.env.HYPERBOLIC_API_KEY!,
      });
    } else if (config.provider === 'openrouter') {
      openai = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY!,
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'Mandela Effect Admin',
        },
      });
    } else {
      console.error(`[generateEffectData] ❌ Неизвестный провайдер: ${config.provider}`);
      continue;
    }
    
    console.log(`[generateEffectData] ✅ Клиент ${config.provider} инициализирован`);
    
    try {
      let rawText = '';
      let tokenUsage: { total_tokens?: number } | null = null;
      
      if (config.provider === 'google' && googleGenAI) {
        // Google Gemini через собственный SDK
        const model = googleGenAI.getGenerativeModel({ 
          model: config.model,
          systemInstruction: systemPrompt,
        });
        const result = await model.generateContent(userPrompt);
        const response = await result.response;
        rawText = response.text();
      } else if (openai) {
        // OpenAI-совместимые провайдеры (Groq, OpenRouter)
        const completion = await openai.chat.completions.create({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        });
        rawText = completion.choices[0]?.message?.content || '';
        tokenUsage = completion.usage || null;
      } else {
        throw new Error('Клиент не инициализирован');
      }

      console.log('');
      console.log(`[generateEffectData] ✅ ПРОВАЙДЕР ${config.provider}/${config.model} ОТВЕТИЛ!`);
      console.log('───────────────────────────────────────────────────────────');
      console.log('Провайдер:', config.provider);
      console.log('Модель использована:', config.model);
      if (tokenUsage) {
        console.log('Токенов использовано:', tokenUsage.total_tokens || 'N/A');
      }
      console.log('');
      console.log('Текст ответа:');
      console.log(rawText);
      console.log('───────────────────────────────────────────────────────────');

      if (!rawText) {
        console.warn(`[generateEffectData] ⚠️ ${config.provider}/${config.model} вернул пустой ответ, пробуем следующую...`);
        failedModels.push(`${config.provider}/${config.model}`);
        // Задержка перед следующим запросом (backoff)
        console.log('[generateEffectData] ⏳ Пауза 2 секунды перед следующей моделью...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      // ШАГ 6: Очищаем ответ от Markdown
      const cleanedText = cleanJsonResponse(rawText);

      console.log('');
      console.log('[generateEffectData] 🧹 ОЧИЩЕННЫЙ JSON:');
      console.log('───────────────────────────────────────────────────────────');
      console.log(cleanedText);
      console.log('───────────────────────────────────────────────────────────');

      // ШАГ 7: Парсим JSON
      let parsed: GeneratedEffectInfo;
      try {
        parsed = JSON.parse(cleanedText);
        console.log('[generateEffectData] ✅ JSON успешно распарсен');
      } catch (parseError) {
        console.error('');
        console.error('[generateEffectData] ❌ ОШИБКА ПАРСИНГА JSON:');
        console.error('Ошибка:', parseError);
        console.error('Текст для парсинга:', cleanedText);
        console.error('');
        
        // Попытка извлечь хоть что-то из ответа
        console.log('[generateEffectData] Пробуем альтернативный парсинг...');
        try {
          // Ищем полный JSON объект с вложенными скобками
          const jsonMatch = cleanedText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
            console.log('[generateEffectData] ✅ Альтернативный парсинг успешен');
          } else {
            throw new Error('Не найден JSON объект');
          }
        } catch {
          console.warn(`[generateEffectData] ⚠️ ${config.provider}/${config.model} вернул невалидный JSON, пробуем следующую...`);
          failedModels.push(`${config.provider}/${config.model}`);
          // Задержка перед следующим запросом (backoff)
          console.log('[generateEffectData] ⏳ Пауза 2 секунды перед следующей моделью...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }

      // ШАГ 7.1: Нормализация данных (защита от массивов)
      const normalizeToString = (val: any): string => {
        if (Array.isArray(val)) {
          return val.join('\n\n'); // Объединяем массивы в текст с абзацами
        }
        if (val === null || val === undefined) {
          return '';
        }
        return String(val);
      };

      // Принудительно приводим поля к строкам, чтобы Prisma не падала
      parsed.residue = normalizeToString(parsed.residue);
      parsed.history = normalizeToString(parsed.history);
      parsed.scientific = normalizeToString(parsed.scientific);
      parsed.community = normalizeToString(parsed.community);
      parsed.currentState = normalizeToString(parsed.currentState);

      console.log('[generateEffectData] ✅ Данные нормализованы (массивы преобразованы в строки)');

      // ШАГ 7.5: Генерируем URL изображения (если разрешено)
      if (shouldGenerateImage && ((parsed as any).imagePrompt || title)) {
        const imagePrompt = (parsed as any).imagePrompt || `${title} mandela effect visual`;
        const promptEncoded = encodeURIComponent(imagePrompt);
        // Добавляем timestamp для избежания кэширования браузера
        const timestamp = Date.now();
        
        // Используем модель flux для всех случаев (она лучше понимает контекст и знаменитостей)
        const model = 'flux';
        
        // ИЗМЕНЕНИЕ: Размер 1280x720 (16:9) вместо 1024x1024
        parsed.imageUrl = `https://image.pollinations.ai/prompt/${promptEncoded}?model=${model}&width=1280&height=720&nologo=true&seed=${timestamp}`;
        console.log(`[generateEffectData] 🖼️ Сгенерирован URL изображения (1280x720, ${model}):`, parsed.imageUrl);
      } else if (!shouldGenerateImage) {
        console.log('[generateEffectData] ⏭️ Генерация изображения пропущена по запросу');
      }

      // ШАГ 8: Проверяем, вернул ли AI ошибку валидации
      if (parsed.error) {
        console.log('[generateEffectData] ⚠️ AI вернул ошибку валидации:', parsed.error);
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        
        // Запоминаем эту модель как рабочую (даже если вернула ошибку валидации - она работает)
        currentModelIndex = modelIndex;
        
        // Возвращаем успех, но с ошибкой в data — клиент должен это обработать
        return {
          success: true,
          data: parsed,
        };
      }

      // ШАГ 9: Проверяем наличие полей и заполняем пустые
      const requiredFields: (keyof GeneratedEffectInfo)[] = [
        'currentState',
        'scientific',
        'community',
        'history',
        'residue',
        'sourceLink',
        'scientificSource',
        'communitySource',
        'historySource',
        'residueSource',
      ];

      console.log('[generateEffectData] Проверка полей:');
      for (const field of requiredFields) {
        const hasField = !!parsed[field];
        console.log(`  - ${field}: ${hasField ? '✅' : '⚠️ пусто'}`);
        if (!parsed[field]) {
          parsed[field] = '';
        }
      }

      console.log('');
      console.log('[generateEffectData] ✅ ГЕНЕРАЦИЯ УСПЕШНА!');
      console.log(`[generateEffectData] Использована конфигурация [${modelIndex}]: ${config.provider}/${config.model}`);
      if (failedModels.length > 0) {
        console.log(`[generateEffectData] Пропущены конфигурации: ${failedModels.join(', ')}`);
      }
      console.log('[generateEffectData] Результат:', JSON.stringify(parsed, null, 2));
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');

      // Запоминаем эту конфигурацию как рабочую для следующих вызовов
      currentModelIndex = modelIndex;
      console.log(`[generateEffectData] 🎯 Запомнили конфигурацию #${modelIndex} (${config.provider}/${config.model}) как рабочую`);

      // Формируем название модели для отображения
      const usedModel = `${config.provider}/${config.model}`;
      
      return {
        success: true,
        data: parsed,
        usedModel,
      };

    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorString = String(error);
      
      console.error('');
      console.error(`[generateEffectData] ❌ Ошибка ${config.provider}/${config.model}:`);
      console.error('Сообщение:', errorMessage);
      
      // Специальная обработка для Google: гео-блок
      if (config.provider === 'google' && (
        errorMessage.includes('Location not supported') ||
        errorMessage.includes('location not supported') ||
        errorMessage.toLowerCase().includes('location not supported') ||
        errorString.includes('Location not supported') ||
        errorString.toLowerCase().includes('location not supported')
      )) {
        console.warn(`[generateEffectData] ⚠️ Google недоступен (Гео-блок), переключаемся на следующую...`);
        failedModels.push(`${config.provider}/${config.model}`);
        // Задержка перед следующим запросом (backoff)
        console.log('[generateEffectData] ⏳ Пауза 2 секунды перед следующей моделью...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      if (isRetryableError(error)) {
        console.warn(`[generateEffectData] ⚠️ ${config.provider}/${config.model} перегружен (429/503), переключаемся на следующую...`);
        failedModels.push(`${config.provider}/${config.model}`);
        // Задержка перед следующим запросом (backoff) - даем API "остыть"
        console.log('[generateEffectData] ⏳ Пауза 2 секунды перед следующей моделью...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      // Если ошибка не связана с перегрузкой - это критическая ошибка
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        const providerNameMap: Record<string, string> = {
          'google': 'GOOGLE_API_KEY',
          'siliconflow': 'SILICONFLOW_API_KEY',
          'cerebras': 'CEREBRAS_API_KEY',
          'groq': 'GROQ_API_KEY',
          'hyperbolic': 'HYPERBOLIC_API_KEY',
          'openrouter': 'OPENROUTER_API_KEY',
        };
        const providerName = providerNameMap[config.provider] || 'API_KEY';
        console.error(`[generateEffectData] ❌ Критическая ошибка: неверный API ключ для ${config.provider}`);
        return {
          success: false,
          error: `Неверный API ключ. Проверьте ${providerName} в .env файле.`,
        };
      }
      
      // Для других ошибок (400, 404 и т.д.) пробуем следующую модель
      console.warn(`[generateEffectData] ⚠️ Ошибка ${config.provider}/${config.model} (${errorMessage}), пробуем следующую...`);
      failedModels.push(`${config.provider}/${config.model}`);
      // Задержка перед следующим запросом (backoff)
      console.log('[generateEffectData] ⏳ Пауза 2 секунды перед следующей моделью...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }
  }

  // Если все провайдеры/модели не сработали
  console.error('');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('[generateEffectData] ❌ ВСЕ ПРОВАЙДЕРЫ/МОДЕЛИ НЕДОСТУПНЫ!');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('Пробовали конфигурации:', failedModels.join(', '));
  console.error('Последняя ошибка:', lastError instanceof Error ? lastError.message : String(lastError));
  console.error('═══════════════════════════════════════════════════════════');
  console.error('');

  return {
    success: false,
    error: `Все AI провайдеры перегружены. Попробуйте через несколько минут. (Пробовали: ${failedModels.length} конфигураций)`,
  };
}

/**
 * Генерирует только изображение для эффекта на основе imagePrompt
 */
/**
 * Генерирует английский промпт для изображения на основе русского названия через AI
 */
async function generateEnglishPromptFromTitle(title: string): Promise<string> {
  console.log('[generateEnglishPromptFromTitle] 🤖 Генерация английского промпта для:', title);
  
  const systemPrompt = `You are an expert Art Director for AI image generation (Flux.1 model). 
Your goal: Create a visual prompt for a Mandela Effect based on a Russian title.

STEP 1: CLASSIFY THE EFFECT TYPE

1. **VISUAL DETAIL** (Monopoly monocle, Pikachu tail) -> Focus on the object/character feature.

2. **QUOTE / MOVIE SCENE** ("Luke I am your father") -> Cinematic shot of the character speaking. NO TEXT.

3. **SPELLING / LOGO** (Kit-Kat, Ford) -> Focus on the PRODUCT/OBJECT.

4. **EVENT / PERSON** (Yeltsin, Mandela) -> Archival footage, TV screengrab style.

STEP 2: GENERATE PROMPT BASED ON TYPE (Aspect Ratio 16:9)

RULES FOR ALL TYPES:

- 🚫 **NO TEXT**: Never ask AI to write words.

- **ASPECT RATIO**: "Wide cinematic shot (16:9)".

- **COMPOSITION**: Center subject, leave headroom.

SPECIFIC INSTRUCTIONS:

- **For VISUAL DETAIL**: "Close up shot of [Object] featuring [The False Memory Detail], highly detailed".

- **For QUOTES**: "Cinematic still frame of [Character] from [Movie Name], speaking expression, atmospheric lighting".

- **For SPELLING/LOGOS**: "Product photography of [Object], professional lighting. Do not focus on letters".

- **For RUSSIAN PEOPLE (Yeltsin/Gorbachev)**: 
  - MANDATORY: Describe physical imperfections (e.g., "heavy puffy face", "jowls", "birthmark").
  - STYLE: "1990s TV news footage, low resolution, VHS noise, blur, scanlines". DO NOT use "4k" or "sharp".

EXAMPLES:

Input: "Ельцин: Я устал"

Output: "Boris Yeltsin 1999 New Year speech, archival TV footage, VHS quality, grainy, blurry, heavy puffy face, deep wrinkles, silver hair, wearing suit and red tie, sitting at desk, Russian flag background, wide shot"

Input: "Монополия: Пенсне"

Output: "Monopoly Man mascot character wearing a monocle, close up portrait, 3d render, rich texture, cinematic lighting, wide shot"

Input: "KitKat: Дефис"

Output: "Chocolate bar snapping in half, macro food photography, chocolate texture, studio lighting, advertising style, no text"

Input: "Люк я твой отец"

Output: "Darth Vader reaching out hand, cinematic still from Star Wars Empire Strikes Back, dark atmosphere, fog, dramatic lighting, wide shot"
`;

  try {
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: title }
        ],
        model: 'openai',
        seed: Date.now(),
        jsonMode: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const englishPrompt = (await response.text()).trim();
    console.log('[generateEnglishPromptFromTitle] ✅ Получен промпт:', englishPrompt);
    
    return englishPrompt;
  } catch (error) {
    console.error('[generateEnglishPromptFromTitle] ❌ Ошибка AI, используем базовый промпт:', error);
    return `${title} Mandela effect, cinematic wide shot, high detail, no text`;
  }
}

export async function generateEffectImage(
  title: string,
  imagePrompt?: string
): Promise<GenerateImageResult> {
  console.log('[generateEffectImage] 🖼️ Генерация изображения для:', title);
  
  if (!title || title.trim().length === 0) {
    return {
      success: false,
      error: 'Название эффекта обязательно',
    };
  }

  try {
    let promptToUse: string;
    
    if (imagePrompt) {
      promptToUse = imagePrompt;
      console.log('[generateEffectImage] 📝 Используется переданный AI-промпт');
    } else {
      console.log('[generateEffectImage] 🤖 Генерируем английский промпт через AI для:', title);
      promptToUse = await generateEnglishPromptFromTitle(title);
    }
    
    const promptEncoded = encodeURIComponent(promptToUse);
    const timestamp = Date.now();
    
    // Используем Flux
    const model = 'flux';
    
    // ИЗМЕНЕНИЕ: Размер 1280x720 (16:9) вместо 1024x1024
    const imageUrl = `https://image.pollinations.ai/prompt/${promptEncoded}?model=${model}&width=1280&height=720&nologo=true&seed=${timestamp}`;
    
    console.log(`[generateEffectImage] ✅ URL изображения сгенерирован (1280x720, ${model}):`, imageUrl);
    
    return {
      success: true,
      imageUrl,
      usedModel: 'flux',
    };
  } catch (error) {
    console.error('[generateEffectImage] ❌ Ошибка:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Не удалось сгенерировать изображение',
    };
  }
}

/**
 * Генерирует умный стилевой промпт для изображения через AI
 */
async function getSmartStylePrompt(title: string): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('[getSmartStylePrompt] ⚠️ OPENROUTER_API_KEY не настроен, используем дефолтный стиль');
    return 'professional photography, 4k, sharp focus, high resolution, clear details, color correction';
  }

  try {
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Mandela Effect Style Generator',
      },
    });

    const systemPrompt = `You are a professional Colorist and Director of Photography.
Your task: Return a comma-separated string of VISUAL STYLE keywords for the given Mandela Effect title.

Rules:
1. Do NOT describe the subject (no 'man', 'cat', 'logo'). Only LIGHTING, TEXTURE, COLOR GRADING, CAMERA TYPE.
2. If historical/retro -> 'VHS quality, noise, datamosh, low res, 90s TV style'.
3. If movie -> 'cinematic lighting, teal and orange, 35mm film grain'.
4. If cartoon -> 'vibrant colors, cel shading, clear lines'.
5. If brand -> 'studio lighting, macro photography, sharp focus, product shot'.
6. Keep it short (10-15 words).`;

    const userPrompt = `Generate visual style keywords for: "${title}"`;

    // Пробуем Claude сначала, затем Llama
    const models = [
      'anthropic/claude-3.5-sonnet',
      'meta-llama/llama-3.3-70b-instruct',
    ];

    for (const model of models) {
      try {
        console.log(`[getSmartStylePrompt] 🎨 Генерация стиля через ${model}...`);
        
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 100,
        });

        const styleKeywords = completion.choices[0]?.message?.content?.trim();
        
        if (styleKeywords) {
          console.log(`[getSmartStylePrompt] ✅ Стиль сгенерирован (${model}):`, styleKeywords);
          return styleKeywords;
        }
      } catch (error: any) {
        console.warn(`[getSmartStylePrompt] ⚠️ Модель ${model} недоступна:`, error.message);
        continue;
      }
    }

    // Если все модели недоступны, возвращаем дефолт
    console.warn('[getSmartStylePrompt] ⚠️ Все модели недоступны, используем дефолтный стиль');
    return 'professional photography, 4k, sharp focus, high resolution, clear details, color correction';
  } catch (error) {
    console.error('[getSmartStylePrompt] ❌ Ошибка:', error);
    return 'professional photography, 4k, sharp focus, high resolution, clear details, color correction';
  }
}

export async function restyleImage(
  title: string,
  sourceImageUrl: string
): Promise<GenerateImageResult> {
  console.log('[restyleImage] 🎨 Стилизация (Flux + AI Style):', title);

  try {
    // 1. Генерируем умный стилевой промпт через AI
    const styleKeywords = await getSmartStylePrompt(title);
    
    // 2. Формируем финальный промпт с акцентом на сохранение композиции и лица
    const stylePrompt = `${title}, ${styleKeywords}, maintain composition, maintain facial features, realistic texture, no distortion`;

    console.log('[restyleImage] 🔧 Промпт:', stylePrompt);

    // 2. Кодируем
    const promptEncoded = encodeURIComponent(stylePrompt);
    const imageEncoded = encodeURIComponent(sourceImageUrl);
    const timestamp = Date.now();
    
    // 3. Формируем URL
    // Используем model=flux (лучшее понимание контекста)
    // width/height = 1280x720 (16:9)
    const finalUrl = `https://image.pollinations.ai/prompt/${promptEncoded}?model=flux&width=1280&height=720&nologo=true&image=${imageEncoded}&seed=${timestamp}`;

    console.log('[restyleImage] ✅ URL:', finalUrl);

    return {
      success: true,
      imageUrl: finalUrl,
      usedModel: 'flux',
    };
  } catch (error) {
    console.error('[restyleImage] ❌ Ошибка:', error);
    return {
      success: false,
      error: 'Не удалось обработать изображение',
    };
  }
}

export async function fitImageToFormat(
  title: string, // Оставляем аргумент для совместимости, но не используем
  sourceImageUrl: string
): Promise<GenerateImageResult> {
  console.log('[fitImageToFormat] 📐 Технический ресайз через wsrv.nl');

  try {
    // Удаляем префикс https:// или http://, так как wsrv принимает url=domain.com/img.jpg
    const cleanSource = sourceImageUrl.replace(/^https?:\/\//, '');
    
    // Формируем URL
    // w=1280, h=720: размер
    // fit=contain: вписать полностью
    // cbg=101010: темно-серый фон (почти черный) для полей
    // output=webp: современный формат
    const finalUrl = `https://wsrv.nl/?url=${encodeURIComponent(cleanSource)}&w=1280&h=720&fit=contain&cbg=101010&output=webp`;

    console.log('[fitImageToFormat] ✅ URL:', finalUrl);

    // Имитируем задержку, чтобы UI успел показать лоадер (опционально)
    await new Promise(r => setTimeout(r, 500));

    return {
      success: true,
      imageUrl: finalUrl,
      usedModel: 'wsrv.nl',
    };
  } catch (error) {
    console.error('[fitImageToFormat] ❌ Ошибка:', error);
    return {
      success: false,
      error: 'Не удалось изменить формат',
    };
  }
}

// Фиктивная переменная для сброса кэша Next.js
const REVALIDATE_CACHE = new Date().getTime();
