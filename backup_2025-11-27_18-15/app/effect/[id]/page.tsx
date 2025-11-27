import { notFound } from 'next/navigation';
import { getEffectById, getEffects } from '@/app/actions/effects';
import EffectClient from './EffectClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EffectPage({ params }: PageProps) {
  const { id } = await params;
  
  // Загружаем эффект по ID
  const effect = await getEffectById(id);
  
  if (!effect) {
    notFound();
  }

  // Загружаем все эффекты для навигации
  const allEffects = await getEffects({ limit: 100 });

  return <EffectClient effect={effect} allEffects={allEffects} />;
}
