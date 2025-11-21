import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Читаем файл напрямую из файловой системы
    const filePath = join(process.cwd(), 'data', 'effects.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const effectsData = JSON.parse(fileContents);

    // Находим эффект с самым близким распределением к 50/50
    let mostControversial = null;
    let minDifference = Infinity;

    for (const effect of effectsData) {
      const totalVotes = effect.votesA + effect.votesB;
      if (totalVotes === 0) continue;

      const percentA = (effect.votesA / totalVotes) * 100;
      const percentB = (effect.votesB / totalVotes) * 100;
      const difference = Math.abs(percentA - percentB);

      if (difference < minDifference) {
        minDifference = difference;
        mostControversial = effect;
      }
    }

    if (!mostControversial) {
      return NextResponse.json(
        { error: 'No controversial effect found' },
        { status: 404 }
      );
    }

    const totalVotes = mostControversial.votesA + mostControversial.votesB;
    const percentA = (mostControversial.votesA / totalVotes) * 100;
    const percentB = (mostControversial.votesB / totalVotes) * 100;

    return NextResponse.json({
      ...mostControversial,
      percentA: Math.round(percentA * 10) / 10,
      percentB: Math.round(percentB * 10) / 10,
      totalVotes,
    });
  } catch (error) {
    console.error('Ошибка загрузки самого спорного эффекта:', error);
    return NextResponse.json(
      { error: 'Failed to load controversial effect' },
      { status: 500 }
    );
  }
}

