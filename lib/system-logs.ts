// Словари для генерации

const PREFIXES = [
  "ERR_MEM_LEAK", "TL_DIVERGENCE", "QUANTUM_NOISE", "SYNAPSE_FAIL", 
  "REALITY_404", "CRITICAL_DESYNC", "BUFFER_OVERFLOW", "ECHO_MISMATCH",
  "PATTERN_VOID", "CACHE_CORRUPTION"
];

const ADJECTIVES = [
  "Фантомный", "Рекурсивный", "Коллективный", "Нестабильный", 
  "Цифровой", "Аналоговый", "Фрактальный", "Искаженный", 
  "Скрытый", "Резонирующий"
];

const NOUNS = [
  "Сектор Памяти", "Культурный Слой", "Нейронный Узел", "Визуальный Паттерн", 
  "Временной Контур", "Якорь Реальности", "Логический Блок", "Поток Данных",
  "Синтаксис Мира", "Архив Образов"
];

const SUFFIXES = [
  "Требуется перезапись...", "Синхронизация невозможна.", "Обнаружено вмешательство.",
  "Индекс достоверности: 12%.", "Загрузка альтернативной версии...", "Связь потеряна.",
  "Попытка восстановления...", "Доступ ограничен.", "Критическая ошибка."
];

// Функция для получения числа из строки (хэш)
function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function generateSystemLog(title: string): string {
  const seed = getHash(title);
  
  const prefix = PREFIXES[seed % PREFIXES.length];
  const adj = ADJECTIVES[(seed + 1) % ADJECTIVES.length];
  const noun = NOUNS[(seed + 2) % NOUNS.length];
  const suffix = SUFFIXES[(seed + 3) % SUFFIXES.length];

  return `${prefix} :: ${adj} ${noun} :: ${suffix}`;
}

