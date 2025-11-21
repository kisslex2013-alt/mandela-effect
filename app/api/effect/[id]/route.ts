import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid effect ID' },
        { status: 400 }
      );
    }

    // Читаем файл напрямую из файловой системы
    const filePath = join(process.cwd(), 'data', 'effects.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const effectsData = JSON.parse(fileContents);

    // Находим эффект по ID
    const effect = effectsData.find((e: any) => e.id === id);

    if (!effect) {
      return NextResponse.json(
        { error: 'Effect not found' },
        { status: 404 }
      );
    }

    // Вычисляем проценты
    const totalVotes = effect.votesA + effect.votesB;
    const percentA = totalVotes > 0 ? Math.round((effect.votesA / totalVotes) * 100 * 10) / 10 : 0;
    const percentB = totalVotes > 0 ? Math.round((effect.votesB / totalVotes) * 100 * 10) / 10 : 0;

    return NextResponse.json({
      ...effect,
      percentA,
      percentB,
      totalVotes,
    });
  } catch (error) {
    console.error('Ошибка загрузки эффекта:', error);
    return NextResponse.json(
      { error: 'Failed to load effect' },
      { status: 500 }
    );
  }
}

