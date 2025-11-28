'use server';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Типы
interface EffectData {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  imageUrl?: string;
  videoUrl?: string;
  residue?: string;
  residueSource?: string;
  history?: string;
  historySource?: string;
  yearDiscovered?: number;
  interpretations?: object;
}

interface CreateEffectData {
  title: string;
  description: string;
  content: string;
  category: string;
  imageUrl?: string;
  videoUrl?: string;
  residue?: string;
  residueSource?: string;
  history?: string;
  historySource?: string;
  yearDiscovered?: number;
  interpretations?: object;
}

/**
 * Обновить эффект
 */
export async function updateEffect(
  id: string,
  data: EffectData
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[updateEffect] Начало обновления эффекта:', id);
    console.log('[updateEffect] Входящие данные:', JSON.stringify(data, null, 2));

    // Формируем объект для обновления
    const updateData: Record<string, unknown> = {};

    // Основные текстовые поля
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.content) updateData.content = data.content;
    if (data.category) updateData.category = data.category;

    // Опциональные URL поля
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl || null;

    // Верхнеуровневые поля для доп. информации
    if (data.residue !== undefined) updateData.residue = data.residue || null;
    if (data.residueSource !== undefined) updateData.residueSource = data.residueSource || null;
    if (data.history !== undefined) updateData.history = data.history || null;
    if (data.historySource !== undefined) updateData.historySource = data.historySource || null;

    // Год открытия
    if (data.yearDiscovered !== undefined) updateData.yearDiscovered = data.yearDiscovered || null;

    // Интерпретации (JSON объект)
    // Ожидаем объект вида: { scientific, scientificSource, community, communitySource, sourceLink }
    if (data.interpretations !== undefined) {
      // Если передан пустой объект или null - очищаем
      if (!data.interpretations || Object.keys(data.interpretations).length === 0) {
        updateData.interpretations = null;
      } else {
        updateData.interpretations = data.interpretations;
      }
    }

    console.log('[updateEffect] Данные для Prisma:', JSON.stringify(updateData, null, 2));

    // Выполняем обновление
    const updatedEffect = await prisma.effect.update({
      where: { id },
      data: updateData,
    });

    console.log('[updateEffect] Эффект успешно обновлён:', updatedEffect.id);

    // Ревалидируем кэш
    revalidatePath('/catalog');
    revalidatePath(`/effect/${id}`);
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('[updateEffect] ОШИБКА при обновлении эффекта:');
    console.error(error);
    
    // Пытаемся извлечь более информативное сообщение об ошибке
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return { success: false, error: `Не удалось обновить эффект: ${errorMessage}` };
  }
}

/**
 * Создать новый эффект
 */
export async function createEffect(
  data: CreateEffectData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const newEffect = await prisma.effect.create({
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        category: data.category,
        imageUrl: data.imageUrl || null,
        videoUrl: data.videoUrl || null,
        residue: data.residue || null,
        residueSource: data.residueSource || null,
        history: data.history || null,
        historySource: data.historySource || null,
        yearDiscovered: data.yearDiscovered || null,
        interpretations: data.interpretations ? data.interpretations : Prisma.JsonNull,
        votesFor: 0,
        votesAgainst: 0,
        views: 0,
      },
    });

    // Ревалидируем кэш
    revalidatePath('/catalog');
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true, id: newEffect.id };
  } catch (error) {
    console.error('Ошибка при создании эффекта:', error);
    return { success: false, error: 'Не удалось создать эффект' };
  }
}

/**
 * Удалить эффект
 */
export async function deleteEffect(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.effect.delete({
      where: { id },
    });

    // Ревалидируем кэш
    revalidatePath('/catalog');
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Ошибка при удалении эффекта:', error);
    return { success: false, error: 'Не удалось удалить эффект' };
  }
}

/**
 * Проверка авторизации администратора
 */
export async function checkAuth(
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Проверяем переменную окружения (может быть undefined если не установлена)
    const adminPassword = process.env.ADMIN_PASSWORD;

    console.log('[checkAuth] Проверка пароля:', {
      hasPassword: !!password,
      passwordLength: password?.length,
      hasEnvVar: !!adminPassword,
      envVarLength: adminPassword?.length,
      envVarPreview: adminPassword ? adminPassword.substring(0, 3) + '...' : 'undefined',
    });

    if (!adminPassword) {
      console.error('[checkAuth] ❌ ADMIN_PASSWORD не установлен в переменных окружения');
      console.error('[checkAuth] Доступные env vars:', Object.keys(process.env).filter(k => k.includes('ADMIN')));
      return { success: false, error: 'Ошибка конфигурации сервера. Переменная ADMIN_PASSWORD не найдена. Проверьте настройки Vercel и перезапустите деплой.' };
    }

    if (password !== adminPassword) {
      console.warn('[checkAuth] ❌ Неверный пароль. Ожидалось:', adminPassword.substring(0, 3) + '...', 'Получено:', password.substring(0, 3) + '...');
      return { success: false, error: 'Неверный пароль' };
    }

    console.log('[checkAuth] ✅ Пароль верный');

    // Устанавливаем cookie для сессии
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 часа
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    return { success: false, error: 'Ошибка авторизации' };
  }
}

/**
 * Проверить сессию администратора
 */
export async function checkAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    return session?.value === 'authenticated';
  } catch {
    return false;
  }
}

/**
 * Выход из админ-панели
 */
export async function logout(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Данные для создания эффекта при одобрении заявки
 */
interface ApproveEffectData {
  title: string;
  description: string;
  content: string;
  category: string;
  imageUrl?: string;
  videoUrl?: string;
  residue?: string;
  residueSource?: string;
  history?: string;
  historySource?: string;
  yearDiscovered?: number;
  interpretations?: object;
}

/**
 * Одобрить заявку и создать эффект с отредактированными данными
 */
export async function approveSubmission(
  id: string,
  data: ApproveEffectData
): Promise<{ success: boolean; effectId?: string; error?: string }> {
  try {
    console.log('[approveSubmission] Одобрение заявки:', id);
    console.log('[approveSubmission] Данные эффекта:', JSON.stringify(data, null, 2));

    // Проверяем, что данные переданы
    if (!data) {
      console.error('[approveSubmission] Ошибка: данные не переданы');
      return { success: false, error: 'Нет данных для создания эффекта' };
    }

    // Проверяем существование заявки
    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      return { success: false, error: 'Заявка не найдена' };
    }

    if (submission.status !== 'PENDING') {
      return { success: false, error: 'Заявка уже обработана' };
    }

    // Валидация обязательных полей
    if (!data.title?.trim()) {
      return { success: false, error: 'Название эффекта обязательно' };
    }
    if (!data.description?.trim()) {
      return { success: false, error: 'Описание (вопрос) обязательно' };
    }
    if (!data.content?.trim()) {
      return { success: false, error: 'Контент (варианты) обязателен' };
    }
    if (!data.category?.trim()) {
      return { success: false, error: 'Категория обязательна' };
    }

    // Создаём эффект с переданными данными
    const newEffect = await prisma.effect.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        content: data.content.trim(),
        category: data.category.trim(),
        imageUrl: data.imageUrl || null,
        videoUrl: data.videoUrl || null,
        residue: data.residue || null,
        residueSource: data.residueSource || null,
        history: data.history || null,
        historySource: data.historySource || null,
        yearDiscovered: data.yearDiscovered || null,
        interpretations: data.interpretations ? data.interpretations : Prisma.JsonNull,
        votesFor: 0,
        votesAgainst: 0,
        views: 0,
      },
    });

    // Обновляем статус заявки и связываем с созданным эффектом
    await prisma.submission.update({
      where: { id },
      data: {
        status: 'APPROVED',
        createdEffectId: newEffect.id,
      },
    });

    console.log('[approveSubmission] ✅ Создан эффект:', newEffect.id);

    // Ревалидируем кэш
    revalidatePath('/catalog');
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true, effectId: newEffect.id };
  } catch (error) {
    console.error('[approveSubmission] ОШИБКА:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return { success: false, error: `Не удалось одобрить заявку: ${errorMessage}` };
  }
}

/**
 * Отклонить заявку
 */
export async function rejectSubmission(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[rejectSubmission] Отклонение заявки:', id);

    // Проверяем существование заявки
    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      return { success: false, error: 'Заявка не найдена' };
    }

    if (submission.status !== 'PENDING') {
      return { success: false, error: 'Заявка уже обработана' };
    }

    // Обновляем статус на REJECTED
    await prisma.submission.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    console.log('[rejectSubmission] Заявка отклонена:', id);

    // Ревалидируем кэш
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('[rejectSubmission] ОШИБКА:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return { success: false, error: `Не удалось отклонить заявку: ${errorMessage}` };
  }
}

