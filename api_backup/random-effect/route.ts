import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Читаем файл напрямую из файловой системы
    const filePath = join(process.cwd(), 'data', 'effects.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const effectsData = JSON.parse(fileContents);

    // Выбираем случайный эффект
    const randomIndex = Math.floor(Math.random() * effectsData.length);
    const randomEffect = effectsData[randomIndex];

    return NextResponse.json({
      id: randomEffect.id,
    });
  } catch (error) {
    console.error('Ошибка загрузки случайного эффекта:', error);
    return NextResponse.json(
      { error: 'Failed to load random effect' },
      { status: 500 }
    );
  }
}

