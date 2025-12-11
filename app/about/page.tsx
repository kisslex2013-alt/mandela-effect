import { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'О Проекте | Эффект Манделы',
  description: 'История и миссия проекта по исследованию сбоев реальности.',
};

export default function AboutPage() {
  return <AboutClient />;
}
