import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const ADMIN_PASSWORD = 'mandela2025';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      );
    }

    const effectsPath = path.join(process.cwd(), 'data', 'effects.json');
    const effects = JSON.parse(await readFile(effectsPath, 'utf-8'));
    
    return NextResponse.json(effects);

  } catch (error) {
    console.error('Ошибка при получении эффектов:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

