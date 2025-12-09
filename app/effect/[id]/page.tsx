import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import EffectPageClient from '@/components/EffectPageClient';

// ISR: Обновление раз в 60 секунд
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function EffectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Только чтение данных
  const effect = await prisma.effect.findUnique({
    where: { id },
    include: {
      _count: { select: { comments: true } },
      comments: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
      }
    },
  });

  if (!effect) notFound();

  const nextEffect = await prisma.effect.findFirst({
    where: { createdAt: { gt: effect.createdAt }, isVisible: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true }
  });

  const prevEffect = await prisma.effect.findFirst({
    where: { createdAt: { lt: effect.createdAt }, isVisible: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true }
  });

  const initialUserVote = null; 

  return (
    <EffectPageClient 
      effect={effect} 
      initialUserVote={initialUserVote} 
      prevEffect={prevEffect}
      nextEffect={nextEffect}
    />
  );
}
