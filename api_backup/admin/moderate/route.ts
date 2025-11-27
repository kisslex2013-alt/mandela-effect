import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

// Простой пароль для доступа (в продакшене используй переменные окружения)
const ADMIN_PASSWORD = 'mandela2025'; // ИЗМЕНИ ЭТО!

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, action, effectId } = body;

    // Проверка пароля
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      );
    }

    const pendingPath = path.join(process.cwd(), 'data', 'pending-effects.json');
    const effectsPath = path.join(process.cwd(), 'data', 'effects.json');

    // Читаем pending эффекты
    let pendingEffects: any[] = [];
    try {
      const fileContent = await readFile(pendingPath, 'utf-8');
      pendingEffects = JSON.parse(fileContent);
    } catch (error) {
      return NextResponse.json(
        { error: 'Ошибка чтения pending-effects.json' },
        { status: 500 }
      );
    }

    const effectIndex = pendingEffects.findIndex((e: any) => e.id === effectId);

    if (effectIndex === -1) {
      return NextResponse.json(
        { error: 'Эффект не найден' },
        { status: 404 }
      );
    }

    const effect = pendingEffects[effectIndex];

    if (action === 'approve') {
      // Одобрить: добавить в effects.json
      let effects: any[] = [];
      try {
        const fileContent = await readFile(effectsPath, 'utf-8');
        effects = JSON.parse(fileContent);
      } catch (error) {
        return NextResponse.json(
          { error: 'Ошибка чтения effects.json' },
          { status: 500 }
        );
      }

      // Генерируем новый ID (максимальный + 1)
      const maxId = Math.max(...effects.map((e: any) => e.id || 0), 0);
      const newId = maxId + 1;

      // Преобразуем эффект в формат effects.json
      const approvedEffect: any = {
        id: newId,
        category: effect.category,
        categoryEmoji: effect.categoryEmoji,
        categoryName: effect.categoryName,
        title: effect.title,
        question: effect.question,
        // Преобразуем variantA и variantB обратно в строки (если они объекты)
        variantA: typeof effect.variantA === 'object' ? effect.variantA.text : effect.variantA,
        variantB: typeof effect.variantB === 'object' ? effect.variantB.text : effect.variantB,
        votesA: effect.votesA || 0,
        votesB: effect.votesB || 0,
        currentState: effect.currentState || '',
        sourceLink: effect.sourceLink || '',
        dateAdded: effect.dateAdded || new Date().toISOString().split('T')[0],
      };

      // Добавляем интерпретации, если они есть
      if (effect.interpretations) {
        approvedEffect.interpretations = effect.interpretations;
      }

      effects.push(approvedEffect);

      // Сохраняем effects.json
      await writeFile(effectsPath, JSON.stringify(effects, null, 2), 'utf-8');
    }

    // Удаляем из pending (и при одобрении и при отклонении)
    pendingEffects.splice(effectIndex, 1);
    await writeFile(pendingPath, JSON.stringify(pendingEffects, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Эффект одобрен' : 'Эффект отклонён',
    });
  } catch (error) {
    console.error('Ошибка модерации:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

