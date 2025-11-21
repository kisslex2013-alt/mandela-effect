# Исправление ошибки сохранения файла

## Проблема
```
Failed to save 'npm command.md': The content of the file is newer. 
Please compare your version with the file contents or overwrite 
the content of the file with your changes.
```

## Причина
Prettier автоматически форматирует `.md` файлы (настроено в `.lintstagedrc.js`), что создает конфликт версий между редактором и диском.

## Решения

### 1. Перезагрузить файл из диска (быстрое решение)
В Cursor:
- Нажмите `Ctrl+Shift+P` (Command Palette)
- Введите: `File: Revert File`
- Или: `File: Reload from Disk`
- Затем сохраните снова (`Ctrl+S`)

### 2. Перезаписать файл на диске
В Cursor:
- Нажмите `Ctrl+Shift+P`
- Введите: `File: Save As...`
- Сохраните с тем же именем (перезапишет)

### 3. Исключить файл из автоформатирования
Если файл не должен форматироваться автоматически, добавьте его в `.prettierignore`:

```bash
# Добавьте в .prettierignore
npm command.md
```

### 4. Настроить Cursor (рекомендуется)
Отключите автоформатирование Markdown при сохранении:
1. Settings (`Ctrl+,`)
2. Найдите: `Editor: Format On Save`
3. Или найдите: `[markdown]` → `Editor: Format On Save`
4. Отключите для Markdown файлов

### 5. Временное решение
Закройте и снова откройте файл, затем сохраните.

---

**Рекомендация:** Используйте решение #1 (Reload from Disk) - это самое быстрое.

