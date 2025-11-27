import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: Request) {
  try {
    // Читаем файл напрямую из файловой системы
    const filePath = join(process.cwd(), 'data', 'effects.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const effectsData = JSON.parse(fileContents);

    // Получаем query параметр category
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Фильтруем по категории, если указана
    let filteredEffects = effectsData;
    if (category) {
      filteredEffects = effectsData.filter((effect: any) => effect.category === category);
    }

    return NextResponse.json(filteredEffects);
  } catch (error) {
    console.error('Ошибка загрузки эффектов:', error);
    return NextResponse.json(
      { error: 'Failed to load effects' },
      { status: 500 }
    );
  }
}

