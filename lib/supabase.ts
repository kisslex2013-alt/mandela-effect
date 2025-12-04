import { createClient } from '@supabase/supabase-js';

// Получаем URL и ключ из переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

// Для загрузки файлов используем service_role (Legacy) или Secret API Key (новый)
// Поддерживаем оба варианта для совместимости
// Это секретный ключ, поэтому НЕ используем NEXT_PUBLIC_ префикс
const supabaseServiceKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY ||  // Legacy service_role key
  process.env.SUPABASE_SECRET_KEY ||        // Новый Secret API Key
  process.env.SUPABASE_SECRET;              // Альтернативное название

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase URL или service key не настроены. Проверьте переменные окружения:');
  console.warn('- NEXT_PUBLIC_SUPABASE_URL (Project URL)');
  console.warn('- SUPABASE_SERVICE_ROLE_KEY (Legacy) или SUPABASE_SECRET_KEY (новый Secret API Key)');
}

// Создаем клиент Supabase для серверных операций с полными правами
// Используем service_role/secret ключ для загрузки файлов
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Имя бакета для загрузки изображений
export const UPLOADS_BUCKET = 'uploads';

