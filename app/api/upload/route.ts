import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveUploadedFile } from '@/lib/file-upload';

const COOKIE_NAME = 'admin_session';

/**
 * Проверка авторизации админа
 */
async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return session?.value === 'authenticated';
}

// Конфигурация для больших файлов
export const maxDuration = 60; // 60 секунд для загрузки больших файлов
export const dynamic = 'force-dynamic';

/**
 * POST /api/upload - Загрузка изображения
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[UPLOAD] Начало загрузки файла');
    
    // Проверка авторизации
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) {
      console.log('[UPLOAD] Ошибка: не авторизован');
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Получение файла из FormData
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('[UPLOAD] Ошибка парсинга FormData:', error);
      // Возможно, файл слишком большой
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Файл слишком большой. Максимальный размер: 10MB' },
          { status: 413 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Ошибка при получении файла. Проверьте размер файла (максимум 10MB)' },
        { status: 400 }
      );
    }
    
    const file = formData.get('file') as File | null;

    if (!file) {
      console.log('[UPLOAD] Ошибка: файл не предоставлен');
      return NextResponse.json(
        { success: false, error: 'Файл не предоставлен' },
        { status: 400 }
      );
    }

    console.log('[UPLOAD] Файл получен:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Сохранение файла
    const result = await saveUploadedFile(file);

    if (!result.success) {
      console.error('[UPLOAD] Ошибка сохранения файла:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    console.log('[UPLOAD] Файл успешно загружен:', {
      url: result.url,
      filename: result.filename
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
    });
  } catch (error) {
    console.error('[UPLOAD] Критическая ошибка:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

