import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Читаем файл напрямую из файловой системы
    const filePath = join(process.cwd(), 'data', 'effects.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const effectsData = JSON.parse(fileContents);

    const totalEffects = effectsData.length;
    const totalVotes = effectsData.reduce(
      (sum: number, effect: any) => sum + effect.votesA + effect.votesB,
      0
    );
    const estimatedParticipants = Math.floor(totalVotes / 3);

    return NextResponse.json({
      totalEffects,
      totalVotes,
      estimatedParticipants,
    });
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
    return NextResponse.json(
      { totalEffects: 15, totalVotes: 48000, estimatedParticipants: 16000 },
      { status: 200 }
    );
  }
}

