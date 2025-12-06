'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Проверяет наличие бакета 'media' и создает его, если нет.
 */
async function ensureBucketExists() {
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    
    if (error) {
      console.error('[Upload] Ошибка проверки бакетов:', error);
      return;
    }

    const mediaBucket = buckets?.find(b => b.name === 'media');

    if (!mediaBucket) {
      console.log('[Upload] Бакет "media" не найден. Создаю...');
      await supabaseAdmin.storage.createBucket('media', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
      });
    }
  } catch (e) {
    console.error('[Upload] Ошибка авто-создания бакета:', e);
  }
}

export async function uploadImage(input: FormData | string): Promise<UploadResult> {
  try {
    await ensureBucketExists();

    let buffer: Buffer;

    // 1. Получаем буфер (из файла или URL)
    if (typeof input === 'string') {
      console.log('[Upload] Скачивание по ссылке:', input);
      
      // ДОБАВЛЕНА МАСКИРОВКА ПОД БРАУЗЕР
      const response = await fetch(input, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      if (!response.ok) {
        throw new Error(`Не удалось скачать изображение: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const file = input.get('file') as File;
      if (!file) throw new Error('Файл не найден');
      console.log('[Upload] Обработка файла:', file.name, file.size);
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // 2. Сжатие через Sharp
    console.log('[Upload] Сжатие изображения...');
    const compressedBuffer = await sharp(buffer)
      .resize(1280, 720, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ quality: 80 })
      .toBuffer();

    // 3. Загрузка в Supabase
    const fileName = `effects/${uuidv4()}.webp`;
    
    const { error } = await supabaseAdmin
      .storage
      .from('media')
      .upload(fileName, compressedBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[Upload] Ошибка Supabase:', error);
      throw new Error(`Ошибка Supabase: ${error.message}`);
    }

    // 4. Получение публичной ссылки
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('media')
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };

  } catch (error: any) {
    console.error('[Upload] Критическая ошибка:', error);
    return { success: false, error: error.message || 'Ошибка загрузки' };
  }
}
