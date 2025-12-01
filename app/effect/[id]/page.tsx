import { Metadata } from 'next';
import { getEffectById, getEffects } from '@/app/actions/effects';
import EffectClient from './EffectClient';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const effect = await getEffectById(id);
  
  if (!effect) {
    return {
      title: 'Эффект не найден',
    };
  }

  return {
    title: `${effect.title} | Эффект Манделы`,
    description: effect.description,
  };
}

export default async function EffectPage({ params }: PageProps) {
  const { id } = await params;
  const effect = await getEffectById(id);

  if (!effect) {
    notFound();
  }

  // Приведение типа interpretations к нужному формату
  const serializedEffect = {
    ...effect,
    interpretations: effect.interpretations as Record<string, string> | null
  };

  return <EffectClient effect={serializedEffect} />;
}
