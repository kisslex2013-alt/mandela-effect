'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiExtractResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Извлекает изображение из Gemini чата по ссылке
 * Использует Gemini API для анализа чата и поиска изображений
 */
export async function extractImageFromGeminiChat(chatUrl: string): Promise<GeminiExtractResult> {
  try {
    console.log('[GEMINI-EXTRACT] Начало извлечения изображения из:', chatUrl);
    
    // Проверяем, что это ссылка на Gemini
    if (!chatUrl.includes('gemini.google.com/app/')) {
      return {
        success: false,
        error: 'Это не ссылка на Gemini чат. Ожидается формат: https://gemini.google.com/app/...',
      };
    }

    // Извлекаем ID чата из URL
    const chatIdMatch = chatUrl.match(/\/app\/([a-zA-Z0-9]+)/);
    if (!chatIdMatch || !chatIdMatch[1]) {
      return {
        success: false,
        error: 'Не удалось извлечь ID чата из ссылки',
      };
    }

    const chatId = chatIdMatch[1];
    console.log('[GEMINI-EXTRACT] ID чата:', chatId);

    // Проверяем наличие API ключа
    if (!process.env.GOOGLE_API_KEY) {
      return {
        success: false,
        error: 'GOOGLE_API_KEY не настроен. Невозможно извлечь изображение из Gemini чата.',
      };
    }

    // Используем Gemini API для анализа чата
    // Примечание: Gemini API не предоставляет прямой доступ к истории чата по ID
    // Но мы можем попросить Gemini проанализировать ссылку и вернуть информацию об изображениях
    try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const prompt = `Проанализируй эту ссылку на Gemini чат: ${chatUrl}

Мне нужно извлечь URL изображения из этого чата. 

Если в чате есть изображения (загруженные пользователем или сгенерированные Gemini), верни прямой URL на одно из изображений в формате:
IMAGE_URL: https://...

Если изображений нет или их нельзя извлечь, верни:
NO_IMAGE: невозможно извлечь

Важно: верни ТОЛЬКО URL изображения или NO_IMAGE, без дополнительного текста.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text().trim();

      console.log('[GEMINI-EXTRACT] Ответ от Gemini:', text);

      // Пытаемся найти URL изображения в ответе
      const imageUrlMatch = text.match(/IMAGE_URL:\s*(https?:\/\/[^\s]+)/i);
      if (imageUrlMatch && imageUrlMatch[1]) {
        const imageUrl = imageUrlMatch[1];
        console.log('[GEMINI-EXTRACT] ✅ Найден URL изображения:', imageUrl);
        return {
          success: true,
          imageUrl: imageUrl,
        };
      }

      // Проверяем, есть ли прямой URL в ответе
      const directUrlMatch = text.match(/https?:\/\/[^\s]+/i);
      if (directUrlMatch && directUrlMatch[0]) {
        const imageUrl = directUrlMatch[0];
        // Проверяем, что это похоже на URL изображения
        if (imageUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) || imageUrl.includes('googleusercontent.com') || imageUrl.includes('storage.googleapis.com')) {
          console.log('[GEMINI-EXTRACT] ✅ Найден прямой URL изображения:', imageUrl);
          return {
            success: true,
            imageUrl: imageUrl,
          };
        }
      }

      // Если в ответе есть NO_IMAGE
      if (text.includes('NO_IMAGE') || text.toLowerCase().includes('невозможно')) {
        return {
          success: false,
          error: 'Не удалось извлечь изображение из Gemini чата. Убедитесь, что в чате есть изображения, и что чат доступен публично.',
        };
      }

      // Если ничего не найдено
      return {
        success: false,
        error: 'Не удалось извлечь изображение из Gemini чата. Попробуйте использовать прямую ссылку на изображение или загрузите файл вручную.',
      };
    } catch (apiError) {
      console.error('[GEMINI-EXTRACT] Ошибка Gemini API:', apiError);
      return {
        success: false,
        error: apiError instanceof Error ? apiError.message : 'Ошибка при обращении к Gemini API',
      };
    }
  } catch (error) {
    console.error('[GEMINI-EXTRACT] Критическая ошибка:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка при извлечении изображения',
    };
  }
}


