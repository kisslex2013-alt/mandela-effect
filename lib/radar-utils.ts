// Утилиты для генерации радарной диаграммы

export const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// Генерация пути SVG
export const makePath = (data: number[], width: number, height: number, padding: number, distortion: number = 0, seed: number = 1) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - padding;
  const angleStep = 360 / data.length;

  const points = data.map((value, i) => {
    // Вносим искажения в значение, если distortion > 0
    // Используем seed и индекс для детерминированного хаоса
    const noise = distortion > 0 
      ? (Math.sin(i * seed) * Math.cos(seed * i)) * distortion 
      : 0;
    
    const adjustedValue = Math.max(0, Math.min(100, value + noise));
    const normalizedValue = (adjustedValue / 100) * radius;
    
    return polarToCartesian(centerX, centerY, normalizedValue, i * angleStep);
  });

  return points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ') + ' Z';
};

// Генерация хэша из строки (для создания Seed из UserAgent)
export const generateSeed = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

