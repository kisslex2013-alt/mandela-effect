# Исправление ошибки "PORT IS IN USE" в MCP Inspector

## Проблема

Ошибка `Proxy Server PORT IS IN USE at port 6277` означает, что порт уже занят другим процессом (скорее всего, уже запущенным MCP Inspector).

## Решения

### Решение 1: Завершить процесс, использующий порт

**Найти процесс:**

```powershell
netstat -ano | findstr :6277
```

**Завершить процесс (замените PID на реальный):**

```powershell
taskkill /PID 584 /F
```

**Или найти и завершить по имени:**

```powershell
# Найти все процессы node/npx
tasklist | findstr node

# Завершить все процессы node (осторожно!)
taskkill /IM node.exe /F
```

### Решение 2: Использовать другой порт

MCP Inspector позволяет указать другой порт через переменную окружения:

```powershell
$env:MCP_INSPECTOR_PORT=6278
npx @modelcontextprotocol/inspector npx @modelcontextprotocol/server-sequential-thinking
```

Или в одной строке:

```powershell
$env:MCP_INSPECTOR_PORT=6278; npx @modelcontextprotocol/inspector npx @modelcontextprotocol/server-sequential-thinking
```

### Решение 3: Подождать освобождения порта

Если процесс в состоянии TIME_WAIT, подождите 1-2 минуты и попробуйте снова. TIME_WAIT означает, что соединение закрывается.

### Решение 4: Перезапустить терминал

Иногда помогает просто закрыть и открыть терминал заново.

## Проверка после исправления

После освобождения порта запустите команду снова:

```powershell
npx @modelcontextprotocol/inspector npx @modelcontextprotocol/server-sequential-thinking
```

Должно появиться:

```
Starting MCP inspector...
MCP Inspector running on http://localhost:6277
```

## Альтернатива: Тестирование без Inspector

Если Inspector продолжает вызывать проблемы, можно протестировать серверы напрямую через Cursor:

1. Убедитесь что серверы настроены в `mcp.json`
2. Перезапустите Cursor
3. Проверьте в Settings → MCP → Installed MCP Servers
4. Убедитесь что нет ошибок подключения

## Быстрая команда для освобождения порта

```powershell
# Найти и завершить процесс на порту 6277
$port = 6277
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "Процесс $process завершен"
} else {
    Write-Host "Порт $port свободен"
}
```
