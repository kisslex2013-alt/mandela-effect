# ⚡ Быстрый старт

## Копирование в новый проект

### Windows PowerShell
```powershell
# Перейдите в папку с project_002
cd "H:\Backup\Zero-Coding\Cursor AI\Dashboardtt\project_002"

# Скопируйте все в корень нового проекта
Copy-Item -Path "*" -Destination "C:\path\to\your\new\project\" -Recurse -Force
```

### Linux/Mac
```bash
# Скопируйте все в корень нового проекта
cp -r project_002/* /path/to/your/new/project/
```

## После копирования

1. **Добавьте скрипты в package.json:**
```json
{
  "scripts": {
    "quality:check": "agent-enforcer check src/ || true",
    "quality:check:verbose": "agent-enforcer check src/ --verbose || true",
    "quality:check:modified": "node scripts/quality-check-modified.js || true",
    "quality:sync-rules": "node scripts/sync-enforcer-rules.js",
    "quality:to-beads": "node scripts/enforcer-to-beads.js"
  }
}
```

2. **Установите зависимости:**
```bash
npm install -g agent-enforcer
```

3. **Проверьте работу:**
```bash
npm run quality:sync-rules
npm run quality:check
```

## Что скопировано

✅ `.cursor/` - Все правила Cursor IDE  
✅ `.cursorrules` - Основной файл правил  
✅ `.agent-enforcer.json` - Конфигурация enforcer  
✅ `.enforcer/` - Дополнительные настройки  
✅ `scripts/` - Вспомогательные скрипты  
✅ `README.md` - Полная документация  

## Важно

- Не копируйте файлы с секретами (`.cursor/mcp.json` - только example файлы)
- Адаптируйте правила под ваш проект
- Проверьте пути в скриптах

---

**Всего файлов:** 47  
**Папок:** 7  
**Готово к использованию!** 🚀

