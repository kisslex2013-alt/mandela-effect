import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// Интерфейсы
interface SubmissionBody {
  category: string;
  title: string;
  question: string;
  variantA: string;
  variantB: string;
  currentState?: string;
  sourceLink?: string;
  email?: string;
}

interface Submission {
  id: number;
  category: string;
  categoryEmoji: string;
  categoryName: string;
  title: string;
  question: string;
  variantA: string;
  variantB: string;
  currentState: string;
  sourceLink: string;
  submitterEmail: string;
  status: 'pending';
  dateSubmitted: string;
  votesA: number;
  votesB: number;
}

interface RateLimitEntry {
  ip: string;
  count: number;
  resetAt: number; // timestamp
}

// Валидация
function validateCategory(category: string): boolean {
  const validCategories = [
    'films',
    'music',
    'brands',
    'people',
    'popculture',
    'geography',
    'childhood',
    'russian',
  ];
  return validCategories.includes(category);
}

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateSubmission(body: SubmissionBody): { valid: boolean; error?: string } {
  // Обязательные поля
  if (!body.category || !body.title || !body.question || !body.variantA || !body.variantB) {
    return { valid: false, error: 'Заполните все обязательные поля' };
  }

  // Валидация категории
  if (!validateCategory(body.category)) {
    return { valid: false, error: 'Неверная категория' };
  }

  // Валидация title
  if (body.title.length < 5) {
    return { valid: false, error: 'Название должно содержать минимум 5 символов' };
  }

  // Валидация question
  if (body.question.length < 20) {
    return { valid: false, error: 'Вопрос должен содержать минимум 20 символов' };
  }

  // Валидация variantA
  if (body.variantA.length < 3) {
    return { valid: false, error: 'Вариант А должен содержать минимум 3 символа' };
  }

  // Валидация variantB
  if (body.variantB.length < 3) {
    return { valid: false, error: 'Вариант Б должен содержать минимум 3 символа' };
  }

  // Проверка что варианты разные
  if (body.variantA === body.variantB) {
    return { valid: false, error: 'Варианты должны быть разными' };
  }

  // Валидация sourceLink (если есть)
  if (body.sourceLink && !validateUrl(body.sourceLink)) {
    return { valid: false, error: 'Некорректный URL источника' };
  }

  // Валидация email (если есть)
  if (body.email && !validateEmail(body.email)) {
    return { valid: false, error: 'Некорректный email адрес' };
  }

  return { valid: true };
}

// Rate limiting
async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining?: number }> {
  const rateLimitPath = path.join(process.cwd(), 'data', 'rate-limits.json');
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 час в миллисекундах
  const maxRequests = 5;

  let rateLimits: RateLimitEntry[] = [];

  try {
    const fileContent = await readFile(rateLimitPath, 'utf-8');
    rateLimits = JSON.parse(fileContent);
  } catch {
    // Файл не существует, создадим новый
    rateLimits = [];
  }

  // Очищаем устаревшие записи
  rateLimits = rateLimits.filter((entry) => entry.resetAt > now);

  // Ищем запись для этого IP
  let entry = rateLimits.find((e) => e.ip === ip);

  if (!entry) {
    // Создаём новую запись
    entry = {
      ip,
      count: 1,
      resetAt: now + oneHour,
    };
    rateLimits.push(entry);
  } else {
    // Проверяем лимит
    if (entry.count >= maxRequests) {
      const remaining = Math.ceil((entry.resetAt - now) / 1000 / 60); // минуты
      return { allowed: false, remaining };
    }
    // Увеличиваем счётчик
    entry.count++;
  }

  // Сохраняем обновлённые лимиты
  await writeFile(rateLimitPath, JSON.stringify(rateLimits, null, 2), 'utf-8');

  const remaining = maxRequests - entry.count;
  return { allowed: true, remaining };
}

// Получение IP адреса
function getClientIP(request: NextRequest): string {
  // Пробуем получить IP из различных заголовков
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback на 'unknown' если IP не найден
  return 'unknown';
}

// Вспомогательные функции для категорий
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    films: '🎬',
    music: '🎵',
    brands: '🏢',
    people: '👤',
    popculture: '🎨',
    geography: '🗺️',
    childhood: '🧸',
    russian: '🇷🇺',
  };
  return emojiMap[category] || '🧠';
}

function getCategoryName(category: string): string {
  const nameMap: Record<string, string> = {
    films: 'Фильмы/ТВ',
    music: 'Музыка',
    brands: 'Бренды',
    people: 'Люди',
    popculture: 'Поп-культура',
    geography: 'География',
    childhood: 'Детство',
    russian: 'Русская культура',
  };
  return nameMap[category] || 'Разное';
}

// Основной handler
export async function POST(request: NextRequest) {
  try {
    // Получаем IP для rate limiting
    const clientIP = getClientIP(request);

    // Проверяем rate limit (только для реальных IP)
    if (clientIP !== 'unknown') {
      const rateLimitCheck = await checkRateLimit(clientIP);
      if (!rateLimitCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Слишком много запросов. Попробуйте через ${rateLimitCheck.remaining} минут(ы)`,
          },
          { status: 429 }
        );
      }
    }

    // Парсим данные из формы
    let body: SubmissionBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат данных' },
        { status: 400 }
      );
    }

    // Валидация
    const validation = validateSubmission(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Создаём объект submission
    const submission: Submission = {
      id: Date.now(),
      category: body.category,
      categoryEmoji: getCategoryEmoji(body.category),
      categoryName: getCategoryName(body.category),
      title: body.title.trim(),
      question: body.question.trim(),
      variantA: body.variantA.trim(),
      variantB: body.variantB.trim(),
      currentState: body.currentState?.trim() || '',
      sourceLink: body.sourceLink?.trim() || '',
      submitterEmail: body.email?.trim() || '',
      status: 'pending',
      dateSubmitted: new Date().toISOString(),
      votesA: 0,
      votesB: 0,
    };

    // Путь к файлу submissions.json
    const submissionsPath = path.join(process.cwd(), 'data', 'submissions.json');

    // Читаем существующие submissions
    let submissions: Submission[] = [];
    try {
      const fileContent = await readFile(submissionsPath, 'utf-8');
      submissions = JSON.parse(fileContent);
    } catch (error) {
      // Если файл не существует - создадим новый массив
      console.log('Файл submissions.json не найден, создаём новый');
      submissions = [];
    }

    // Добавляем новую submission
    submissions.push(submission);

    // Записываем обратно
    await writeFile(submissionsPath, JSON.stringify(submissions, null, 2), 'utf-8');

    return NextResponse.json(
      {
        success: true,
        message: 'Эффект отправлен на модерацию',
        submissionId: submission.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ошибка в API /api/submit:', error);
    return NextResponse.json(
      { success: false, error: 'Произошла ошибка при отправке' },
      { status: 500 }
    );
  }
}
