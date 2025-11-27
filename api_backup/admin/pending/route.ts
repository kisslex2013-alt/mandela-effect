import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const ADMIN_PASSWORD = 'mandela2025'; // Тот же пароль

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    // Проверка пароля
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      );
    }

    const pendingPath = path.join(process.cwd(), 'data', 'pending-effects.json');

    try {
      const fileContent = await readFile(pendingPath, 'utf-8');
      const pendingEffects = JSON.parse(fileContent);
      return NextResponse.json(pendingEffects);
    } catch (error) {
      // Если файл не существует, возвращаем пустой массив
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Ошибка при получении pending эффектов:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

