import { Metadata } from 'next';
import IdentityClient from './IdentityClient';

export const metadata: Metadata = {
  title: 'Моя Память | Эффект Манделы',
  description: 'Анализ вашего восприятия реальности. Узнайте, из какой вы вселенной.',
};

export default function MyMemoryPage() {
  return <IdentityClient />;
}
