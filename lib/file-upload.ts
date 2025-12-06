import { supabase, UPLOADS_BUCKET } from './supabase';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

/**
 * Валидация файла перед загрузкой
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Проверка размера
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  // Проверка типа MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `Недопустимый тип файла. Разрешены: ${ALLOWED_MIME_TYPES.join(', ')}` };
  }

  // Проверка расширения
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: `Недопустимое расширение файла. Разрешены: ${ALLOWED_EXTENSIONS.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Загружает изображение по URL и сохраняет его на наш сервер
 * Используется для сохранения изображений из Gemini чата, чтобы обойти CORS/403 блокировки
 */
export async function saveImageFromUrl(imageUrl: string, originalName?: string): Promise<UploadResult> {
  try {
    console.log('[FILE-UPLOAD] Начало загрузки изображения по URL:', imageUrl);

    // Загружаем изображение с сервера (где нет CORS ограничений)
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.google.com/',
      },
    });

    if (!response.ok) {
      console.error('[FILE-UPLOAD] Ошибка загрузки изображения:', response.status, response.statusText);
      return {
        success: false,
        error: `Не удалось загрузить изображение: ${response.status} ${response.statusText}`,
      };
    }

    // Получаем тип контента
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Проверяем, что это изображение
    if (!contentType.startsWith('image/')) {
      return {
        success: false,
        error: `Получен неверный тип контента: ${contentType}. Ожидается изображение.`,
      };
    }

    // Получаем данные изображения
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Генерируем имя файла
    const extension = contentType.split('/')[1] || 'jpg';
    const filename = generateFilename(originalName || `image.${extension}`);

    console.log('[FILE-UPLOAD] Изображение загружено, размер:', buffer.length, 'байт');

    // Сохраняем в Supabase Storage
    if (supabase) {
      try {
        console.log('[FILE-UPLOAD] Попытка сохранения в Supabase Storage...');
        
        const { data, error } = await supabase.storage
          .from(UPLOADS_BUCKET)
          .upload(filename, buffer, {
            contentType,
            upsert: false,
          });

        if (error) {
          console.error('[FILE-UPLOAD] Ошибка Supabase Storage:', error);
          
          if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
            return {
              success: false,
              error: `Бакет ${UPLOADS_BUCKET} не найден. Создайте его в Supabase Dashboard.`,
            };
          }
          throw error;
        }

        // Получаем публичный URL
        const { data: urlData } = supabase.storage
          .from(UPLOADS_BUCKET)
          .getPublicUrl(filename);

        if (!urlData.publicUrl.startsWith('http')) {
          return {
            success: false,
            error: 'Получен относительный URL вместо полного Supabase URL.',
          };
        }

        console.log('[FILE-UPLOAD] Изображение сохранено:', urlData.publicUrl);

        return {
          success: true,
          url: urlData.publicUrl,
          filename,
        };
      } catch (error) {
        console.error('[FILE-UPLOAD] Ошибка при сохранении в Supabase:', error);
        throw error;
      }
    }

    // Fallback: сохраняем локально в dev режиме
    if (process.env.NODE_ENV === 'development') {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const filePath = path.join(uploadsDir, filename);
      await fs.writeFile(filePath, buffer);
      
      return {
        success: true,
        url: `/uploads/${filename}`,
        filename,
      };
    }

    return {
      success: false,
      error: 'Supabase Storage не настроен и не в dev режиме.',
    };
  } catch (error) {
    console.error('[FILE-UPLOAD] Критическая ошибка при загрузке изображения:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке изображения',
    };
  }
}

/**
 * Генерация уникального имени файла
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  return `${timestamp}-${random}${extension}`;
}

/**
 * Сохранение файла в Supabase Storage или локальную файловую систему
 */
export async function saveUploadedFile(file: File): Promise<UploadResult> {
  try {
    console.log('[FILE-UPLOAD] Начало сохранения файла');
    
    // Валидация
    const validation = validateFile(file);
    if (!validation.valid) {
      console.log('[FILE-UPLOAD] Ошибка валидации:', validation.error);
      return { success: false, error: validation.error };
    }

    // Генерация имени файла
    const filename = generateFilename(file.name);
    console.log('[FILE-UPLOAD] Сгенерировано имя файла:', filename);

    // Конвертация File в Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Проверка наличия Supabase
    console.log('[FILE-UPLOAD] Проверка Supabase:', {
      supabaseExists: !!supabase,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY),
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL
    });

    // В ПРОДАКШЕНЕ ОБЯЗАТЕЛЬНО ИСПОЛЬЗУЕМ SUPABASE
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      if (!supabase) {
        console.error('[FILE-UPLOAD] КРИТИЧЕСКАЯ ОШИБКА: Supabase не настроен в продакшене!');
        return {
          success: false,
          error: 'Supabase Storage не настроен. Установите переменные окружения NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SECRET_KEY (или SUPABASE_SERVICE_ROLE_KEY) в Vercel.',
        };
      }
    }

    // Пробуем использовать Supabase Storage, если настроен
    if (supabase) {
      try {
        console.log('[FILE-UPLOAD] Попытка загрузки в Supabase Storage...');
        
        // Загружаем файл в Supabase Storage
        const { data, error } = await supabase.storage
          .from(UPLOADS_BUCKET)
          .upload(filename, buffer, {
            contentType: file.type,
            upsert: false, // Не перезаписывать существующие файлы
          });

        if (error) {
          console.error('[FILE-UPLOAD] Ошибка Supabase Storage:', {
            message: error.message,
            error: error
          });
          
          // Если бакет не существует, попробуем создать его
          if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
            console.log(`[FILE-UPLOAD] Бакет ${UPLOADS_BUCKET} не найден. Попытка создать...`);
            // Создание бакета должно быть выполнено вручную в Supabase Dashboard
            return {
              success: false,
              error: `Бакет ${UPLOADS_BUCKET} не найден. Создайте его в Supabase Dashboard (Storage → Create bucket → ${UPLOADS_BUCKET} → Public).`,
            };
          }
          throw error;
        }

        console.log('[FILE-UPLOAD] Файл загружен в Supabase:', data);

        // Получаем публичный URL
        const { data: urlData } = supabase.storage
          .from(UPLOADS_BUCKET)
          .getPublicUrl(filename);

        console.log('[FILE-UPLOAD] Публичный URL:', urlData.publicUrl);

        // ВАЖНО: Проверяем, что URL полный, а не относительный
        if (!urlData.publicUrl.startsWith('http')) {
          console.error('[FILE-UPLOAD] ОШИБКА: URL не является полным:', urlData.publicUrl);
          return {
            success: false,
            error: 'Получен относительный URL вместо полного Supabase URL. Проверьте настройки Supabase.',
          };
        }

        return {
          success: true,
          url: urlData.publicUrl, // Полный URL из Supabase
          filename,
        };
      } catch (supabaseError) {
        console.error('[FILE-UPLOAD] Исключение при загрузке в Supabase:', supabaseError);
        // В продакшене не используем fallback
        const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
        if (isProduction) {
          return {
            success: false,
            error: supabaseError instanceof Error ? supabaseError.message : 'Ошибка загрузки в Supabase Storage',
          };
        }
        // Fallback только в dev режиме
        if (!process.env.VERCEL) {
          console.log('[FILE-UPLOAD] Fallback на локальное хранилище...');
        }
      }
    }

    // Fallback: используем локальную файловую систему (ТОЛЬКО в dev, НЕ в продакшене)
    const isProductionEnv = process.env.VERCEL || process.env.NODE_ENV === 'production';
    if (!isProductionEnv) {
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const { existsSync } = await import('fs');
      
      const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
      
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }
      
      const filepath = join(UPLOAD_DIR, filename);
      await writeFile(filepath, buffer);
      
      const url = `/uploads/${filename}`;
      console.log('[FILE-UPLOAD] Используется локальное хранилище:', url);
      
      return {
        success: true,
        url,
        filename,
      };
    }

    // Если Supabase не настроен и мы в продакшене
    return {
      success: false,
      error: 'Supabase Storage не настроен. Установите переменные окружения NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SECRET_KEY (или SUPABASE_SERVICE_ROLE_KEY).',
    };
  } catch (error) {
    console.error('[FILE-UPLOAD] Критическая ошибка:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка при сохранении файла',
    };
  }
}
