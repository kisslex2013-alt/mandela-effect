import { ADJECTIVES, NOUNS, DESCRIPTION_TEMPLATES, QUOTES } from './identity-data';
import { CATEGORY_MAP } from './constants';

// Превращает строку (seed) в числовой индекс от 0 до max-1
function getSeededIndex(seed: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) % max;
}

export function generateRealityID(): string {
  if (typeof window === 'undefined') return 'Earth-616';
  
  const nav = navigator as any;
  const platformCode = (nav.platform || 'Win').slice(0, 3).toUpperCase();
  const width = window.screen.width;
  const timezone = Math.abs(new Date().getTimezoneOffset() / 60);
  const sectors = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Zeta', 'Omega'];
  const sector = sectors[timezone % sectors.length] || 'Prime';
  
  return `Dimension ${platformCode}-${width}-${sector}`;
}

export function generateArchetype(matchPercentage: number, topCategorySlug: string, seed: string) {
  // 1. Прилагательное
  const adjGroup = ADJECTIVES.find(a => matchPercentage >= a.min && matchPercentage <= a.max) || ADJECTIVES[2];
  // Используем seed + 'adj' для уникальности
  const adj = adjGroup.words[getSeededIndex(seed + 'adj', adjGroup.words.length)];

  // 2. Существительное
  // Маппинг наших категорий на ключи в NOUNS
  let nounKey = 'other';
  if (topCategorySlug === 'russian') nounKey = 'russian';
  else if (['films', 'music', 'popculture'].includes(topCategorySlug)) nounKey = 'films';
  else if (['brands', 'food', 'shopping'].includes(topCategorySlug)) nounKey = 'brands';
  else if (['childhood', 'people'].includes(topCategorySlug)) nounKey = 'childhood';
  else if (['tech', 'science', 'space'].includes(topCategorySlug)) nounKey = 'tech';

  const nounList = NOUNS[nounKey] || NOUNS['other'];
  // Используем seed + 'noun'
  const noun = nounList[getSeededIndex(seed + 'noun', nounList.length)];

  return `${adj} ${noun}`;
}

export function generateDescription(matchPercentage: number, topCategorySlug: string, seed: string) {
  // Используем seed + 'intro' для выбора вступления
  const introIndex = getSeededIndex(seed + 'intro', DESCRIPTION_TEMPLATES.intros.length);
  const intro = DESCRIPTION_TEMPLATES.intros[introIndex](matchPercentage);
  
  // Деталь по категории
  let detailKey = 'other';
  if (topCategorySlug === 'russian') detailKey = 'russian';
  else if (['brands', 'food'].includes(topCategorySlug)) detailKey = 'brands';
  else if (['films', 'music'].includes(topCategorySlug)) detailKey = 'films';
  else if (['childhood'].includes(topCategorySlug)) detailKey = 'childhood';
  else if (['tech', 'science'].includes(topCategorySlug)) detailKey = 'tech';
  
  const detail = (DESCRIPTION_TEMPLATES.details as any)[detailKey] || DESCRIPTION_TEMPLATES.details.other;
  
  // Используем seed + 'verdict' для выбора вердикта
  const verdict = DESCRIPTION_TEMPLATES.verdicts[getSeededIndex(seed + 'verdict', DESCRIPTION_TEMPLATES.verdicts.length)];

  return `${intro} ${detail} ${verdict}`;
}

export function getThoughtOfDay(matchPercentage: number, topCategorySlug: string, seed: string) {
  // Простая логика подбора тегов
  const tags = ['general'];
  if (matchPercentage > 70) tags.push('high_mandela', 'paranoia');
  if (['tech', 'science'].includes(topCategorySlug)) tags.push('tech');
  if (['russian', 'history'].includes(topCategorySlug)) tags.push('history');
  if (['childhood'].includes(topCategorySlug)) tags.push('nostalgia');

  // Фильтруем цитаты
  const relevantQuotes = QUOTES.filter(q => q.tags.some(t => tags.includes(t)));
  const pool = relevantQuotes.length > 0 ? relevantQuotes : QUOTES;
  
  // Используем seed + 'quote' для выбора цитаты
  return pool[getSeededIndex(seed + 'quote', pool.length)].text;
}

