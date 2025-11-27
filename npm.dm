# Для разработки (демо-данные)
npm run db:reset-demo

# Для продакшена (чистая база)
npm run db:reset-prod

# Просто запустить сид (режим demo по умолчанию)
npm run db:seed

# Или с переменной окружения
SEED_MODE=production npx prisma db seed