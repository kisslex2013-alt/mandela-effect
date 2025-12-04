# Настройка Vercel Blob Storage для загрузки изображений

## Проблема
Vercel - это serverless платформа, и файлы, сохраненные в файловую систему, не сохраняются между деплоями и не доступны в продакшене.

## Решение
Используем Vercel Blob Storage для хранения загруженных изображений.

## Настройка

### 1. Установка (уже выполнено)
```bash
npm install @vercel/blob
```

### 2. Настройка в Vercel Dashboard

1. Перейдите в ваш проект на [vercel.com](https://vercel.com)
2. Откройте **Settings** → **Storage**
3. Нажмите **Create Database** → выберите **Blob**
4. Создайте Blob Storage (если еще не создан)
5. Скопируйте токен **BLOB_READ_WRITE_TOKEN**

### 3. Добавление переменной окружения

В Vercel Dashboard:
1. Перейдите в **Settings** → **Environment Variables**
2. Добавьте переменную:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: токен из шага 2
   - **Environment**: Production, Preview, Development (отметьте все)

### 4. Передеплой

После добавления переменной окружения:
1. Перейдите в **Deployments**
2. Нажмите **Redeploy** на последнем деплое
3. Или сделайте новый commit и push в GitHub

## Как это работает

- **В dev режиме** (localhost): файлы сохраняются локально в `public/uploads/`
- **В продакшене** (Vercel): файлы сохраняются в Vercel Blob Storage и доступны по публичным URL

## Проверка

После настройки:
1. Загрузите изображение через админку
2. Проверьте, что URL изображения начинается с `https://*.public.blob.vercel-storage.com/`
3. Изображение должно отображаться на сайте

## Альтернативные решения

Если не хотите использовать Vercel Blob Storage, можно использовать:
- **Cloudinary** (бесплатный план до 25GB)
- **AWS S3** (pay-as-you-go)
- **Supabase Storage** (если уже используете Supabase)

