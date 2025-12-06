/**
 * Утилита для объединения классов Tailwind CSS
 * Простая реализация без внешних зависимостей
 */
export function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return inputs
    .filter(Boolean)
    .join(' ')
    .split(' ')
    .filter((cls, index, arr) => {
      // Простая дедупликация: оставляем последний класс, если есть конфликт
      const baseClass = cls.split('-')[0];
      const conflictingIndex = arr.findIndex((c, i) => i > index && c.startsWith(baseClass));
      return conflictingIndex === -1;
    })
    .join(' ');
}

