# Исправление ошибки Filesystem MCP сервера

## Проблема

Filesystem сервер показывает ошибку "Error - Show Output" в Settings → MCP.

## Возможные причины

1. **Неправильный синтаксис путей для Windows**
   - Windows использует обратные слеши `\` вместо прямых `/`
   - Переменная `${workspaceFolder}` может не разрешаться правильно

2. **Синтаксис `:ro` не поддерживается**
   - Некоторые версии server-filesystem не поддерживают `:ro` суффикс
   - Нужно использовать обычные пути

3. **Директории не существуют**
   - Проверьте что `src/` и `public/` существуют в проекте

## ✅ Исправление

### Вариант 1: Убрать `:ro` суффикс (исправлено)

Конфигурация обновлена - убран `:ro` суффикс:

```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "${workspaceFolder}\\src",
    "${workspaceFolder}\\public"
  ]
}
```

**Изменения:**

- Убран `:ro` суффикс (read-only может не поддерживаться)
- Использованы обратные слеши `\\` для Windows
- Оставлены только необходимые директории

### Вариант 2: Если нужно read-only

Если read-only критично важен, можно временно убрать filesystem сервер или использовать только одну директорию:

```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "${workspaceFolder}\\src"
  ]
}
```

### Вариант 3: Абсолютные пути (если переменная не работает)

Если `${workspaceFolder}` не разрешается, используйте абсолютный путь:

```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "H:\\Backup\\Zero-Coding\\Cursor AI\\Dashboardtt\\src",
    "H:\\Backup\\Zero-Coding\\Cursor AI\\Dashboardtt\\public"
  ]
}
```

⚠️ **Не рекомендуется** - путь жестко закодирован и не будет работать в других проектах.

## Проверка после исправления

1. **Перезапустите Cursor** полностью
2. Откройте **Settings → MCP → Installed MCP Servers**
3. Проверьте статус filesystem:
   - ✅ Зеленый = работает
   - ❌ Красный = все еще ошибка

4. **Проверьте логи:**
   - Откройте Output панель в Cursor
   - Выберите "MCP" в фильтре
   - Ищите ошибки filesystem сервера

## Если ошибка сохраняется

### Проверьте логи в Output:

1. View → Output (или `Ctrl + Shift + U`)
2. Выберите "MCP" в выпадающем списке
3. Ищите ошибки типа:
   - "ENOENT: no such file or directory"
   - "Invalid directory"
   - "Failed to start server"

### Альтернатива: Временно отключить filesystem

Если filesystem не критичен, можно временно отключить:

1. Settings → MCP → Installed MCP Servers
2. Выключите переключатель для filesystem
3. Это освободит место для других серверов (лимит 40 инструментов)

## Безопасность без `:ro`

Без read-only суффикса filesystem сервер может изменять файлы. Но:

- Доступ ограничен только `src/` и `public/`
- Нет доступа к `.cursor/`, `.git/`, `node_modules/`
- Это стандартная конфигурация для большинства проектов

## Итог

Конфигурация обновлена. **Перезапустите Cursor** и проверьте статус filesystem сервера.

Если ошибка сохраняется, проверьте логи в Output панели для детальной информации об ошибке.
