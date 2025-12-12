import { Metadata } from 'next';
import AboutClient from './AboutClient';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mandela-effect.ru';

export const metadata: Metadata = {
  title: 'О Проекте | Эффект Манделы',
  description: 'История и миссия проекта по исследованию сбоев реальности.',
  alternates: {
    canonical: `${baseUrl}/about`,
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
