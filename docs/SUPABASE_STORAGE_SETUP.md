# Настройка Supabase Storage для загрузки изображений

## Преимущества
- Уже используете Supabase для БД
- Бесплатный план: 1GB хранилища
- Простая интеграция
- Публичные URL для изображений

## Настройка

### 1. Установка (уже выполнено)
```bash
npm install @supabase/supabase-js
```

### 2. Создание бакета в Supabase Dashboard

1. Перейдите в ваш проект на [supabase.com](https://supabase.com)
2. Откройте **Storage** в боковом меню
3. Нажмите **Create bucket**
4. Настройки:
   - **Name**: `uploads`
   - **Public bucket**: ✅ Включено (чтобы изображения были доступны публично)
   - **File size limit**: 10MB (или больше по необходимости)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif` (опционально)
5. Нажмите **Create bucket**

### 3. Получение ключей Supabase

1. В Supabase Dashboard перейдите в **Settings** → **API**
2. Скопируйте:
   - **Project URL** (находится в самом верху страницы Settings → API, в разделе "Project URL", например: `https://xxxxx.supabase.co`)
   
3. Выберите один из вариантов для серверного ключа:
   
   **Вариант A: Новые ключи (рекомендуется)**
   - В разделе **"Publishable and secret API keys"** найдите **Secret API Key**
   - Нажмите "Reveal" и скопируйте ключ
   - Используйте переменную: `SUPABASE_SECRET_KEY`
   
   **Вариант B: Legacy ключи (старый способ)**
   - В разделе **"Legacy anon, service_role API keys"** найдите **service_role secret key**
   - Нажмите "Reveal" и скопируйте ключ
   - Используйте переменную: `SUPABASE_SERVICE_ROLE_KEY`
   
   ⚠️ **ВАЖНО**: Оба ключа дают полные права! Никогда не публикуйте их в клиентском коде
   - Используйте их только в серверных операциях (Server Actions, API routes)

### 4. Добавление переменных окружения

#### В Vercel Dashboard:
1. Перейдите в **Settings** → **Environment Variables**
2. Добавьте переменные:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Project URL из шага 3
   - **Environment**: Production, Preview, Development
   
   - **Name**: `SUPABASE_SECRET_KEY` (или `SUPABASE_SERVICE_ROLE_KEY` для Legacy)
   - **Value**: Secret API Key из шага 3
   - **Environment**: Production, Preview, Development
   - ⚠️ **ВАЖНО**: НЕ используйте префикс `NEXT_PUBLIC_` для secret ключа (это секретный ключ!)

#### В локальной разработке (.env.local):
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SECRET_KEY=eyJ... (Secret API Key из новых ключей)
# ИЛИ для Legacy:
# SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role secret key)
```

⚠️ **Безопасность**: Убедитесь, что `.env.local` добавлен в `.gitignore` и не попадает в репозиторий!

### 5. Передеплой

После добавления переменных окружения:
1. Перейдите в **Deployments** в Vercel
2. Нажмите **Redeploy** на последнем деплое
3. Или сделайте новый commit и push в GitHub

## Как это работает

- **В dev режиме** (localhost): 
  - Если Supabase настроен → файлы сохраняются в Supabase Storage
  - Если не настроен → файлы сохраняются локально в `public/uploads/`
- **В продакшене** (Vercel): файлы сохраняются в Supabase Storage и доступны по публичным URL

## Проверка

После настройки:
1. Загрузите изображение через админку
2. Проверьте, что URL изображения начинается с `https://*.supabase.co/storage/v1/object/public/uploads/`
3. Изображение должно отображаться на сайте

## Устранение проблем

### Ошибка "Bucket not found"
- Убедитесь, что бакет `uploads` создан в Supabase Dashboard
- Проверьте, что бакет помечен как **Public**

### Ошибка "Invalid API key"
- Проверьте, что переменные окружения установлены правильно
- Убедитесь, что используется `SUPABASE_SECRET_KEY` (новый Secret API Key) или `SUPABASE_SERVICE_ROLE_KEY` (Legacy service_role key) для загрузки файлов
- Проверьте, что ключ скопирован полностью (он очень длинный)
- Убедитесь, что используется именно **Secret API Key** или **service_role key**, а не **Publishable** или **anon** ключ

### Изображения не отображаются
- Проверьте, что бакет помечен как **Public**
- Проверьте URL изображения в браузере
- Убедитесь, что домен Supabase добавлен в `next.config.ts` в `remotePatterns`

