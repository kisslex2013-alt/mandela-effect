import { getQuizEffects, type EffectResult } from '@/app/actions/effects';
import QuizClient from './QuizClient';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mandela-effect.ru';

export const metadata = {
  title: 'Квиз | Эффект Манделы',
  description: 'Проверь свою память! Пройди квиз и узнай, насколько твои воспоминания совпадают с большинством.',
  alternates: {
    canonical: `${baseUrl}/quiz`,
  },
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
  // QuizClient теперь сам загружает эффекты на клиенте с учетом visitorId
  // Передаем пустой массив, чтобы компонент загрузил эффекты сам
  return <QuizClient />;
}
