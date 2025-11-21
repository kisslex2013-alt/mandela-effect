import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// Простой mutex для защиты от race conditions
let isProcessing = false;
const processingQueue: Array<() => Promise<void>> = [];

async function processWithLock<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const process = async () => {
      if (isProcessing) {
        processingQueue.push(process);
        return;
      }

      isProcessing = true;
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        isProcessing = false;
        const next = processingQueue.shift();
        if (next) {
          next();
        }
      }
    };

    process();
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { effectId, variant } = body;

    // Валидация входных данных
    if (typeof effectId !== 'number' || isNaN(effectId)) {
      return NextResponse.json(
        { error: 'Invalid effectId. Must be a number.' },
        { status: 400 }
      );
    }

    if (variant !== 'A' && variant !== 'B') {
      return NextResponse.json(
        { error: "Invalid variant. Must be 'A' or 'B'." },
        { status: 400 }
      );
    }

    // Обработка с защитой от race conditions
    const result = await processWithLock(async () => {
      const filePath = join(process.cwd(), 'data', 'effects.json');

      // Читаем файл
      const fileContents = await readFile(filePath, 'utf8');
      const effectsData = JSON.parse(fileContents);

      // Находим эффект
      const effectIndex = effectsData.findIndex((e: any) => e.id === effectId);
      if (effectIndex === -1) {
        throw new Error('NOT_FOUND');
      }

      const effect = effectsData[effectIndex];

      // Обновляем голоса
      if (variant === 'A') {
        effect.votesA += 1;
      } else {
        effect.votesB += 1;
      }

      // Вычисляем проценты
      const totalVotes = effect.votesA + effect.votesB;
      const percentA = Math.round((effect.votesA / totalVotes) * 100);
      const percentB = 100 - percentA;

      // Сохраняем обратно в файл
      await writeFile(filePath, JSON.stringify(effectsData, null, 2), 'utf8');

      return {
        effect: {
          ...effect,
          percentA,
          percentB,
          totalVotes,
        },
        stats: {
          votesA: effect.votesA,
          votesB: effect.votesB,
          percentA,
          percentB,
          totalVotes,
        },
      };
    });

    return NextResponse.json({
      success: true,
      effect: result.effect,
      stats: result.stats,
    });
  } catch (error: any) {
    console.error('Ошибка при голосовании:', error);

    if (error.message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: 'Effect not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process vote. Please try again.' },
      { status: 500 }
    );
  }
}
