'use server';

import prisma from '@/lib/prisma';

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Проверяет, является ли строка валидным URL
 * Пустая строка считается валидной (поле необязательное)
 * URL должен содержать доменную зону (точку в hostname)
 */
function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') return true; // Пустое поле ок
  try {
    const parsed = new URL(url);
    // Проверяем, что hostname содержит точку (доменная зона)
    return parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

/**
 * Проверяет, является ли строка валидным email
 * Пустая строка считается валидной (поле необязательное)
 */
function isValidEmail(email: string): boolean {
  if (!email || email.trim() === '') return true; // Пустое поле ок
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Нормализует URL: добавляет https:// если протокол отсутствует
 * Если строка пустая — возвращает пустую строку
 */
function normalizeUrl(url: string): string {
  if (!url || url.trim() === '') return '';
  const trimmed = url.trim();
  
  // Если уже есть протокол — возвращаем как есть
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Добавляем https:// по умолчанию
  return `https://${trimmed}`;
}

/**
 * Проверяет, похожи ли два заголовка (с учётом перестановки слов)
 * Возвращает true если более 50% значимых слов совпадают
 */
function areTitlesSimilar(title1: string, title2: string): boolean {
  // Приводим к нижнему регистру и удаляем знаки препинания
  const normalize = (str: string): string[] => {
    return str
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s]/gi, '') // Оставляем только буквы, цифры и пробелы
      .split(/\s+/)
      .filter(word => word.length >= 3); // Фильтруем короткие слова (предлоги и т.д.)
  };

  const words1 = normalize(title1);
  const words2 = normalize(title2);

  // Если один из заголовков пустой после нормализации — не похожи
  if (words1.length === 0 || words2.length === 0) {
    return false;
  }

  // Считаем совпадающие слова
  const set1 = new Set(words1);
  const set2 = new Set(words2);

  // Количество слов из title1, которые есть в title2
  let matchCount = 0;
  for (const word of words1) {
    if (set2.has(word)) {
      matchCount++;
    }
  }

  // Процент совпадения относительно меньшего заголовка
  const minLength = Math.min(words1.length, words2.length);
  const matchPercent = matchCount / minLength;

  // Если более 50% слов совпадают — считаем дублем
  return matchPercent > 0.5;
}

/**
 * Проверяет текст на спам-паттерны
 * Возвращает true если текст выглядит как спам
 */
function isSpamText(text: string): boolean {
  if (!text || text.trim() === '') return false;
  
  // Проверка на повторяющиеся символы (более 5 подряд)
  // Например: "аааааа", "!!!!!!"
  if (/(.)\1{5,}/i.test(text)) {
    return true;
  }
  
  // Проверка на повторяющиеся слова
  // Например: "приветприветпривет"
  const words = text.toLowerCase().replace(/[^a-zа-яё]/gi, '');
  if (words.length >= 6) {
    // Проверяем, состоит ли текст из повторения одного паттерна
    for (let len = 1; len <= Math.floor(words.length / 3); len++) {
      const pattern = words.slice(0, len);
      const repeated = pattern.repeat(Math.ceil(words.length / len)).slice(0, words.length);
      if (repeated === words) {
        return true;
      }
    }
  }
  
  return false;
}

// ==================== КОНСТАНТЫ ВАЛИДАЦИИ ====================

const MAX_TITLE_LENGTH = 100;
const MAX_QUESTION_LENGTH = 150;
const MAX_VARIANT_LENGTH = 100;

// ==================== ТИПЫ ====================

interface SubmitEffectData {
  // Основные поля
  category: string;
  title: string;
  question: string;
  variantA: string;
  variantB: string;
  currentState?: string;
  sourceLink?: string;
  email?: string;

  // Интерпретации могут приходить как объект
  interpretations?: {
    scientific?: string;
    scientificTheory?: string;
    scientificSource?: string;
    community?: string;
    communitySource?: string;
  };

  // Или как отдельные поля (для совместимости с разными формами)
  scientific?: string;
  scientificSource?: string;
  community?: string;
  communitySource?: string;
}

// Результат с ошибками по полям
interface SubmitResultWithErrors {
  success: false;
  message: string;
  errors: Record<string, string>;
}

// Результат успеха
interface SubmitResultSuccess {
  success: true;
  message: string;
}

type SubmitResult = SubmitResultWithErrors | SubmitResultSuccess;

/**
 * Отправить эффект на модерацию
 */
export async function submitEffect(data: SubmitEffectData): Promise<SubmitResult> {
  try {
    console.log('[submitEffect] ======= НАЧАЛО ОБРАБОТКИ =======');
    console.log('[submitEffect] Получены данные:', JSON.stringify(data, null, 2));

    // ШАГ А: Подготовка и нормализация данных
    const category = data.category?.trim() || '';
    const title = data.title?.trim() || '';
    const question = data.question?.trim() || '';
    const variantA = data.variantA?.trim() || '';
    const variantB = data.variantB?.trim() || '';
    const currentState = data.currentState?.trim() || '';
    const email = data.email?.trim() || '';
    
    // Нормализуем URL-ы (добавляем https:// если нет протокола)
    const sourceLink = normalizeUrl(data.sourceLink || '');
    const scientificSource = normalizeUrl(
      data.scientificSource || data.interpretations?.scientificSource || ''
    );
    const communitySource = normalizeUrl(
      data.communitySource || data.interpretations?.communitySource || ''
    );
    
    // Текстовые поля интерпретаций
    const scientific = data.scientific?.trim() || data.interpretations?.scientific?.trim() || '';
    const community = data.community?.trim() || data.interpretations?.community?.trim() || '';

    // ШАГ Б: Валидация с накоплением ошибок
    const errors: Record<string, string> = {};

    // Обязательные поля
    if (!category) {
      errors.category = 'Выберите категорию';
    }
    
    // Валидация title
    if (!title) {
      errors.title = 'Введите название';
    } else if (title.length < 3) {
      errors.title = 'Название должно содержать минимум 3 символа';
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.title = `Слишком длинный текст (максимум ${MAX_TITLE_LENGTH} символов)`;
    } else if (isSpamText(title)) {
      errors.title = 'Текст выглядит неестественно';
    }
    
    // Валидация question
    if (!question) {
      errors.question = 'Введите вопрос';
    } else if (question.length < 5) {
      errors.question = 'Вопрос должен содержать минимум 5 символов';
    } else if (question.length > MAX_QUESTION_LENGTH) {
      errors.question = `Слишком длинный текст (максимум ${MAX_QUESTION_LENGTH} символов)`;
    } else if (!question.trim().endsWith('?')) {
      errors.question = "Вопрос должен заканчиваться знаком '?'";
    } else if (isSpamText(question)) {
      errors.question = 'Текст выглядит неестественно';
    }
    
    // Валидация variantA
    if (!variantA) {
      errors.variantA = 'Введите вариант А';
    } else if (variantA.length > MAX_VARIANT_LENGTH) {
      errors.variantA = `Слишком длинный текст (максимум ${MAX_VARIANT_LENGTH} символов)`;
    } else if (isSpamText(variantA)) {
      errors.variantA = 'Текст выглядит неестественно';
    }
    
    // Валидация variantB
    if (!variantB) {
      errors.variantB = 'Введите вариант Б';
    } else if (variantB.length > MAX_VARIANT_LENGTH) {
      errors.variantB = `Слишком длинный текст (максимум ${MAX_VARIANT_LENGTH} символов)`;
    } else if (isSpamText(variantB)) {
      errors.variantB = 'Текст выглядит неестественно';
    }
    
    // Варианты должны быть разными
    if (variantA && variantB && variantA === variantB) {
      errors.variantB = 'Варианты А и Б должны быть разными';
    }

    // Валидация URL-ов (после нормализации)
    if (sourceLink && !isValidUrl(sourceLink)) {
      errors.sourceLink = 'Некорректная ссылка (должна начинаться с http:// или https://)';
    }
    
    if (scientificSource && !isValidUrl(scientificSource)) {
      errors.scientificSource = 'Некорректная ссылка на научный источник';
    }
    
    if (communitySource && !isValidUrl(communitySource)) {
      errors.communitySource = 'Некорректная ссылка на источник сообщества';
    }

    // Валидация email
    if (email && !isValidEmail(email)) {
      errors.email = 'Введите корректный email';
    }

    // Если есть ошибки — возвращаем их
    if (Object.keys(errors).length > 0) {
      // Формируем общее сообщение из первой ошибки
      const firstErrorKey = Object.keys(errors)[0];
      const firstErrorMessage = errors[firstErrorKey];
      
      console.log('[submitEffect] Ошибки валидации:', JSON.stringify(errors, null, 2));
      
      return {
        success: false,
        message: firstErrorMessage,
        errors,
      };
    }

    // ШАГ В: Проверка дублей (с учётом перестановки слов)
    console.log('[submitEffect] Проверка на дубли...');

    // Получаем все заголовки из базы (только поле title для оптимизации)
    const existingEffects = await prisma.effect.findMany({
      select: { title: true },
    });

    const existingSubmissions = await prisma.submission.findMany({
      where: { status: 'PENDING' },
      select: { title: true },
    });

    console.log(`[submitEffect] Найдено ${existingEffects.length} эффектов и ${existingSubmissions.length} заявок для проверки`);

    // Проверяем на похожесть с существующими эффектами
    for (const effect of existingEffects) {
      if (areTitlesSimilar(title, effect.title)) {
        console.log('[submitEffect] Найден похожий эффект:', effect.title);
        return {
          success: false,
          message: `Похожий эффект уже существует: "${effect.title}"`,
          errors: { title: `Похожий эффект уже существует: "${effect.title}"` },
        };
      }
    }

    // Проверяем на похожесть с ожидающими заявками
    for (const submission of existingSubmissions) {
      if (areTitlesSimilar(title, submission.title)) {
        console.log('[submitEffect] Найдена похожая заявка:', submission.title);
        return {
          success: false,
          message: `Похожий эффект уже отправлен на модерацию: "${submission.title}"`,
          errors: { title: `Похожий эффект уже отправлен на модерацию: "${submission.title}"` },
        };
      }
    }

    // ШАГ Г: Собираем interpretations
    let interpretationsData: Record<string, string> | null = null;

    const hasAnyInterpretation = scientific || scientificSource || community || communitySource;

    if (hasAnyInterpretation) {
      interpretationsData = {};
      if (scientific) {
        interpretationsData.scientific = scientific;
      }
      if (scientificSource) {
        interpretationsData.scientificSource = scientificSource;
      }
      if (community) {
        interpretationsData.community = community;
      }
      if (communitySource) {
        interpretationsData.communitySource = communitySource;
      }
    }

    console.log('[submitEffect] Собранные interpretations:', JSON.stringify(interpretationsData, null, 2));

    // ШАГ Д: Создаём запись в базе данных
    console.log('[submitEffect] Создание записи в БД...');

    const submission = await prisma.submission.create({
      data: {
        category,
        title,
        question,
        variantA,
        variantB,
        currentState: currentState || null,
        sourceLink: sourceLink || null,
        submitterEmail: email || null,
        interpretations: interpretationsData,
        status: 'PENDING',
      },
    });

    console.log('[submitEffect] ✅ Создана заявка:', submission.id);
    console.log('[submitEffect] ======= КОНЕЦ ОБРАБОТКИ =======');

    return {
      success: true,
      message: 'Эффект успешно отправлен на модерацию!',
    };
  } catch (error) {
    console.error('[submitEffect] ❌ КРИТИЧЕСКАЯ ОШИБКА:');
    console.error('[submitEffect] Тип ошибки:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[submitEffect] Сообщение:', error instanceof Error ? error.message : String(error));
    console.error('[submitEffect] Stack:', error instanceof Error ? error.stack : 'N/A');

    // Общая ошибка
    return {
      success: false,
      message: 'Произошла внутренняя ошибка сервера',
      errors: { _general: 'Произошла внутренняя ошибка сервера' },
    };
  }
}

/**
 * Получить список категорий для формы (из БД)
 */
export async function getSubmitCategories(): Promise<{ category: string; emoji: string; name: string }[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    
    return categories.map((cat) => ({
      category: cat.slug,
      emoji: cat.emoji,
      name: cat.name,
    }));
  } catch (error) {
    console.error('[getSubmitCategories] Ошибка:', error);
    // Fallback на статические категории если БД недоступна
    return [
      { category: 'films', emoji: '🎬', name: 'Фильмы/ТВ' },
      { category: 'brands', emoji: '🏢', name: 'Бренды' },
      { category: 'music', emoji: '🎵', name: 'Музыка' },
      { category: 'other', emoji: '❓', name: 'Другое' },
    ];
  }
}
