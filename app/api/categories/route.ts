import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Читаем файл напрямую из файловой системы
    const filePath = join(process.cwd(), 'data', 'effects.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const effectsData = JSON.parse(fileContents);

    // Группируем эффекты по категориям
    const categoriesMap = new Map<string, {
      category: string;
      emoji: string;
      name: string;
      count: number;
    }>();

    for (const effect of effectsData) {
      const categoryId = effect.category;
      
      if (!categoriesMap.has(categoryId)) {
        categoriesMap.set(categoryId, {
          category: categoryId,
          emoji: effect.categoryEmoji,
          name: effect.categoryName,
          count: 0,
        });
      }
      
      const category = categoriesMap.get(categoryId)!;
      category.count++;
    }

    // Преобразуем Map в массив
    const categories = Array.from(categoriesMap.values());

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error);
    return NextResponse.json(
      { error: 'Failed to load categories' },
      { status: 500 }
    );
  }
}

