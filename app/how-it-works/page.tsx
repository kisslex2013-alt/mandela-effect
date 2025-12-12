import { Metadata } from 'next';
import HowItWorksClient from './HowItWorksClient';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mandela-effect.ru';

export const metadata: Metadata = {
  title: 'Как это работает | Эффект Манделы',
  description: 'Методология исследования и алгоритмы анализа коллективной памяти.',
  alternates: {
    canonical: `${baseUrl}/how-it-works`,
  },
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
