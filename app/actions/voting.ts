'use server';

import prisma from '@/lib/prisma';

export interface VoteResult {
  success: boolean;
  effect?: {
    id: string;
    votesFor: number;
    votesAgainst: number;
    percentA: number;
    percentB: number;
    totalVotes: number;
  };
  error?: string;
}

/**
 * Голосование за эффект
 */
export async function vote(effectId: string, variant: 'A' | 'B'): Promise<VoteResult> {
  try {
    // Обновляем счётчик голосов
    const updatedEffect = await prisma.effect.update({
      where: { id: effectId },
      data: {
        votesFor: variant === 'A' ? { increment: 1 } : undefined,
        votesAgainst: variant === 'B' ? { increment: 1 } : undefined,
      },
    });

    const totalVotes = updatedEffect.votesFor + updatedEffect.votesAgainst;
    const percentA = totalVotes > 0 ? (updatedEffect.votesFor / totalVotes) * 100 : 50;
    const percentB = totalVotes > 0 ? (updatedEffect.votesAgainst / totalVotes) * 100 : 50;

    return {
      success: true,
      effect: {
        id: updatedEffect.id,
        votesFor: updatedEffect.votesFor,
        votesAgainst: updatedEffect.votesAgainst,
        percentA: Math.round(percentA * 10) / 10,
        percentB: Math.round(percentB * 10) / 10,
        totalVotes,
      },
    };
  } catch (error) {
    console.error('Ошибка при голосовании:', error);
    return {
      success: false,
      error: 'Не удалось сохранить голос',
    };
  }
}

