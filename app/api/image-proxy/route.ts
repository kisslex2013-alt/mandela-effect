import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/image-proxy?url=... - Проксирование изображений для обхода CORS
 * Используется для изображений из Google (googleusercontent.com, googleapis.com)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    console.log('[IMAGE-PROXY] Запрос:', { imageUrl });

    if (!imageUrl) {
      console.log('[IMAGE-PROXY] Ошибка: URL не предоставлен');
      return NextResponse.json(
        { error: 'URL параметр обязателен' },
        { status: 400 }
      );
    }

    // Проверяем, что это разрешенный домен
    const allowedDomains = [
      'googleusercontent.com',
      'googleapis.com',
      'storage.googleapis.com',
    ];

    const urlObj = new URL(imageUrl);
    const isAllowed = allowedDomains.some(domain => 
      urlObj.hostname.includes(domain)
    );

    console.log('[IMAGE-PROXY] Проверка домена:', { 
      hostname: urlObj.hostname, 
      isAllowed 
    });

    if (!isAllowed) {
      console.log('[IMAGE-PROXY] Ошибка: домен не разрешен');
      return NextResponse.json(
        { error: 'Домен не разрешен для проксирования' },
        { status: 403 }
      );
    }

    console.log('[IMAGE-PROXY] Начало загрузки изображения с:', imageUrl);

    // Загружаем изображение на сервере с полным набором заголовков браузера
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/',
        'Origin': 'https://www.google.com',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
        'Cache-Control': 'no-cache',
      },
      // Добавляем redirect: 'follow' для обработки редиректов
      redirect: 'follow',
    });

    console.log('[IMAGE-PROXY] Ответ от источника:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
    });

    if (!response.ok) {
      console.error('[IMAGE-PROXY] Ошибка загрузки:', response.status, response.statusText);
      
      // Если получили HTML вместо изображения (403/404), пробуем получить текст ошибки
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/html')) {
        try {
          const errorText = await response.text();
          console.error('[IMAGE-PROXY] HTML ответ (возможно, страница ошибки):', errorText.substring(0, 500));
        } catch (e) {
          console.error('[IMAGE-PROXY] Не удалось прочитать тело ответа:', e);
        }
      }
      
      return NextResponse.json(
        { 
          error: `Ошибка загрузки изображения: ${response.status} ${response.statusText}`,
          details: 'Google может блокировать запросы с сервера. Попробуйте использовать прямую ссылку на изображение или загрузите файл вручную.'
        },
        { status: response.status }
      );
    }

    // Получаем тип контента
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await response.arrayBuffer();

    console.log('[IMAGE-PROXY] Изображение загружено:', {
      size: imageBuffer.byteLength,
      contentType,
    });

    // Возвращаем изображение с правильными заголовками
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('[IMAGE-PROXY] Критическая ошибка:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

