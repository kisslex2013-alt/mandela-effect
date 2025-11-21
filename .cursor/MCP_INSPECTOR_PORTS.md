# Решение проблем с портами MCP Inspector

## Проблема: "PORT IS IN USE"

MCP Inspector использует два порта:

- **6277** - Proxy server (для браузера)
- **6274** - Сам Inspector (внутренний)

Если любой из портов занят, Inspector не запустится.

## Быстрое решение

### Освободить оба порта одной командой:

```powershell
# Найти и завершить процессы на портах 6274 и 6277
$ports = @(6274, 6277)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) {
        Stop-Process -Id $process -Force
        Write-Host "Порт $port освобожден (PID: $process)"
    }
}
```

### Или вручную:

```powershell
# Найти процессы
netstat -ano | findstr :6274
netstat -ano | findstr :6277

# Завершить (замените PID)
taskkill /PID <PID> /F
```

## Использовать другие порты

Если порты постоянно заняты, можно использовать переменные окружения:

```powershell
$env:MCP_INSPECTOR_PORT=6278
$env:MCP_INSPECTOR_PROXY_PORT=6279
npx -y @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-sequential-thinking
```

## Альтернатива: Тестирование через Cursor

**Inspector не обязателен!** Cursor автоматически подключает MCP серверы.

### Проверка в Cursor:

1. **Settings → MCP → Installed MCP Servers**
   - Проверьте статус каждого сервера
   - ✅ Зеленый = работает
   - ❌ Красный = ошибка

2. **Settings → MCP → Available Tools**
   - Проверьте список доступных инструментов
   - Должно быть меньше 40 (лимит Cursor)

3. **Output панель**
   - Проверьте логи подключения
   - Ищите ошибки подключения

### Если сервер не работает:

**Проверьте логи в Output:**

- Откройте Output панель в Cursor
- Выберите "MCP" в фильтре
- Ищите ошибки подключения

**Проверьте конфигурацию:**

- Убедитесь что `mcp.json` правильный
- Проверьте API ключи/токены
- Убедитесь что пакеты существуют в npm

## Рекомендация

Для обычной работы **не нужен Inspector**. Он нужен только для:

- Глубокой отладки проблем подключения
- Тестирования новых MCP серверов
- Разработки собственных серверов

Для проверки работы серверов достаточно Settings → MCP в Cursor.

## Быстрая проверка всех серверов

**В Cursor:**

1. Settings → MCP → Installed MCP Servers
2. Проверьте каждый сервер:
   - sequential-thinking ✅
   - context7 ✅ (нужен API ключ)
   - filesystem ✅
   - memory ✅
   - github ✅ (нужен токен)
   - browser-tools ✅

**Если все зеленые** - серверы работают! Inspector не нужен.
