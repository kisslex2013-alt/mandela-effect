import effectsData from '@/data/effects.json';

export interface Effect {
  id: number;
  category: string;
  categoryEmoji: string;
  categoryName: string;
  title: string;
  question: string;
  variantA: string;
  variantB: string;
  votesA: number;
  votesB: number;
  currentState: string;
  sourceLink: string;
  dateAdded: string;
}

/**
 * Подсчитывает общее количество эффектов
 */
export function getTotalEffects(): number {
  return effectsData.length;
}

/**
 * Подсчитывает общее количество голосов (сумма votesA + votesB всех эффектов)
 */
export function getTotalVotes(): number {
  return effectsData.reduce((total, effect) => {
    return total + effect.votesA + effect.votesB;
  }, 0);
}

/**
 * Подсчитывает примерное количество участников (голоса / 3)
 */
export function getEstimatedParticipants(): number {
  const totalVotes = getTotalVotes();
  return Math.floor(totalVotes / 3);
}

/**
 * Получает статистику проекта
 */
export function getProjectStats() {
  return {
    totalEffects: getTotalEffects(),
    totalVotes: getTotalVotes(),
    estimatedParticipants: getEstimatedParticipants(),
  };
}

