# Скрипт для очистки кеша Next.js (PowerShell)
Write-Host "🧹 Очистка кеша Next.js..." -ForegroundColor Yellow

# Удаляем .next папку
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Удалена папка .next" -ForegroundColor Green
} else {
    Write-Host "⚠️  Папка .next не найдена" -ForegroundColor Yellow
}

# Удаляем node_modules/.cache если есть
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ Удалена папка node_modules/.cache" -ForegroundColor Green
}

Write-Host "✨ Кеш очищен! Перезапустите dev сервер." -ForegroundColor Green

