#!/bin/bash
# Скрипт для очистки кеша Next.js (Bash)

echo "🧹 Очистка кеша Next.js..."

# Удаляем .next папку
if [ -d ".next" ]; then
    rm -rf .next
    echo "✅ Удалена папка .next"
else
    echo "⚠️  Папка .next не найдена"
fi

# Удаляем node_modules/.cache если есть
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "✅ Удалена папка node_modules/.cache"
fi

echo "✨ Кеш очищен! Перезапустите dev сервер."

