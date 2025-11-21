# Исправление ошибки Preview в Cursor IDE

## Проблема
```
Error loading webview: Error: Could not register service worker: 
InvalidStateError: Failed to register a ServiceWorker: 
The document is in an invalid state.
```

## Решения (по порядку)

### 1. Перезапуск Cursor
- Закройте Cursor полностью
- Откройте снова
- Попробуйте открыть preview

### 2. Очистка кэша Cursor

**Windows:**
```powershell
# Закройте Cursor перед выполнением
Remove-Item -Recurse -Force "$env:APPDATA\Cursor\Cache"
Remove-Item -Recurse -Force "$env:APPDATA\Cursor\Code Cache"
Remove-Item -Recurse -Force "$env:APPDATA\Cursor\GPUCache"
```

**Или вручную:**
1. Закройте Cursor
2. Откройте `%APPDATA%\Cursor`
3. Удалите папки: `Cache`, `Code Cache`, `GPUCache`
4. Запустите Cursor снова

### 3. Отключение расширений
1. Откройте Extensions (Ctrl+Shift+X)
2. Отключите все расширения
3. Перезапустите Cursor
4. Попробуйте preview
5. Если работает - включайте расширения по одному

### 4. Проверка настроек Cursor
1. Settings (Ctrl+,)
2. Найдите "Markdown Preview"
3. Проверьте настройки preview
4. Попробуйте изменить "Markdown Preview: Breaks" или другие опции

### 5. Обновление Cursor
1. Help → Check for Updates
2. Установите последнюю версию
3. Перезапустите

### 6. Альтернатива: Внешний просмотр
Если preview не работает, используйте:
- **Markdown Preview Enhanced** расширение
- Или откройте файл в браузере через простой Markdown viewer

### 7. Проверка файла
Файл `.cursor/BEST_PRACTICES_SUMMARY.md` корректен:
- ✅ Все ошибки Markdown исправлены
- ✅ Правильная нумерация списков
- ✅ Корректный синтаксис

Проблема **НЕ** в содержимом файла, а в Cursor IDE.

---

**Рекомендация:** Начните с перезапуска Cursor и очистки кэша (шаги 1-2).

