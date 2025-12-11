import { Metadata } from 'next';
import HowItWorksClient from './HowItWorksClient';

export const metadata: Metadata = {
  title: 'Как это работает | Эффект Манделы',
  description: 'Методология исследования и алгоритмы анализа коллективной памяти.',
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
