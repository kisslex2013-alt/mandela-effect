import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mandela-effect.ru';

export const metadata: Metadata = {
  title: 'Предложить эффект - Эффект Манделы',
  description: 'Помоги расширить коллекцию эффектов Манделы. Добавь свой пример.',
  alternates: {
    canonical: `${baseUrl}/submit`,
  },
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

