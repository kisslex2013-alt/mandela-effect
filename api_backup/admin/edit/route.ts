import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const ADMIN_PASSWORD = 'mandela2025'; // Тот же пароль

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, effectId, updatedEffect } = body;

    // Проверка пароля
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      );
    }

    const isPending = effectId.toString().startsWith('pending_');
    const filePath = isPending
      ? path.join(process.cwd(), 'data', 'pending-effects.json')
      : path.join(process.cwd(), 'data', 'effects.json');

    // Читаем файл
    const effects = JSON.parse(await readFile(filePath, 'utf-8'));
    const effectIndex = effects.findIndex((e: any) => 
      isPending ? e.id === effectId : e.id === parseInt(effectId.toString())
    );

    if (effectIndex === -1) {
      return NextResponse.json(
        { error: 'Эффект не найден' },
        { status: 404 }
      );
    }

    // Обновляем эффект
    let finalEffect = {
      ...effects[effectIndex],
      ...updatedEffect,
      id: effects[effectIndex].id, // Сохраняем оригинальный ID
    };

    // Преобразуем variantA и variantB в зависимости от типа файла
    if (!isPending) {
      // Для effects.json: преобразуем объекты в строки
      if (typeof finalEffect.variantA === 'object') {
        finalEffect.variantA = finalEffect.variantA.text;
      }
      if (typeof finalEffect.variantB === 'object') {
        finalEffect.variantB = finalEffect.variantB.text;
      }
    } else {
      // Для pending-effects.json: преобразуем строки в объекты
      if (typeof finalEffect.variantA === 'string') {
        finalEffect.variantA = {
          text: finalEffect.variantA,
          description: finalEffect.currentState || '',
        };
      }
      if (typeof finalEffect.variantB === 'string') {
        finalEffect.variantB = {
          text: finalEffect.variantB,
          description: '',
        };
      }
    }

    effects[effectIndex] = finalEffect;

    // Сохраняем
    await writeFile(filePath, JSON.stringify(effects, null, 2), 'utf-8');

    return NextResponse.json({ 
      success: true,
      message: 'Эффект обновлён'
    });

  } catch (error) {
    console.error('Ошибка редактирования:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

