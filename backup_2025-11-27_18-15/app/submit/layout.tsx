import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Предложить эффект - Эффект Манделы',
  description: 'Помоги расширить коллекцию эффектов Манделы. Добавь свой пример.',
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

