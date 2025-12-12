import { Metadata } from 'next';
import IdentityClient from './IdentityClient';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mandela-effect.ru';

export const metadata: Metadata = {
  title: 'Моя Память | Эффект Манделы',
  description: 'Анализ вашего восприятия реальности. Узнайте, из какой вы вселенной.',
  alternates: {
    canonical: `${baseUrl}/my-memory`,
  },
};

export default function MyMemoryPage() {
  return <IdentityClient />;
}
