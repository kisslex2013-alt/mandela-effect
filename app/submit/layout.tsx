import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Предложить эффект - Эффект Манделы',
  description: 'Помоги расширить коллекцию эффектов Манделы',
  keywords: 'предложить эффект манделы, добавить эффект, коллективная память',
  alternates: {
    canonical: 'https://yourdomain.com/submit',
  },
  openGraph: {
    title: 'Предложить эффект - Эффект Манделы',
    description: 'Помоги расширить коллекцию эффектов Манделы',
    type: 'website',
    url: 'https://yourdomain.com/submit',
  },
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

