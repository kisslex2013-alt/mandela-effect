import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const ADMIN_PASSWORD = 'mandela2025';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, effectId } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      );
    }

    const effectsPath = path.join(process.cwd(), 'data', 'effects.json');
    const effects = JSON.parse(await readFile(effectsPath, 'utf-8'));
    
    const filteredEffects = effects.filter((e: any) => e.id !== parseInt(effectId.toString()));

    if (filteredEffects.length === effects.length) {
      return NextResponse.json(
        { error: 'Эффект не найден' },
        { status: 404 }
      );
    }

    await writeFile(effectsPath, JSON.stringify(filteredEffects, null, 2), 'utf-8');

    return NextResponse.json({ 
      success: true,
      message: 'Эффект удалён'
    });

  } catch (error) {
    console.error('Ошибка удаления:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

