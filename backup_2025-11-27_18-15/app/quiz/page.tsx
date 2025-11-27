import { getQuizEffects } from '@/app/actions/effects';
import QuizClient from './QuizClient';

export const metadata = {
  title: 'Квиз | Эффект Манделы',
  description: 'Проверь свою память! Пройди квиз и узнай, насколько твои воспоминания совпадают с большинством.',
};

// Хелпер для парсинга вариантов из content
function parseVariantsFromContent(content: string): { variantA: string; variantB: string } {
  const lines = content.split('\n');
  const variantALine = lines.find((l) => l.startsWith('Вариант А:'));
  const variantBLine = lines.find((l) => l.startsWith('Вариант Б:'));
  return {
    variantA: variantALine?.replace('Вариант А: ', '').trim() || 'Вариант А',
    variantB: variantBLine?.replace('Вариант Б: ', '').trim() || 'Вариант Б',
  };
}

export default async function QuizPage() {
  // Загружаем 10 случайных эффектов для квиза
  const rawEffects = await getQuizEffects(10);

  // Преобразуем в формат для QuizClient
  const effects = rawEffects.map((effect) => {
    const { variantA, variantB } = parseVariantsFromContent(effect.content);
    return {
      id: effect.id,
      title: effect.title,
      question: effect.description,
      variantA,
      variantB,
      votesA: effect.votesFor,
      votesB: effect.votesAgainst,
      category: effect.category,
    };
  });

  return <QuizClient effects={effects} />;
}
