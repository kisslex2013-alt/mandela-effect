'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Интерфейс категории (сериализуемый - даты как строки)
export interface Category {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  color: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Вспомогательная функция для сериализации категории
function serializeCategory(category: {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  color: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): Category {
  return {
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

// Интерфейс для создания/обновления
export interface CategoryInput {
  slug: string;
  name: string;
  emoji: string;
  color?: string | null;
  sortOrder?: number;
}

/**
 * Получить все категории
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });
    // Сериализуем даты в строки для корректной передачи клиенту
    return categories.map(serializeCategory);
  } catch (error) {
    console.error('[getCategories] Ошибка:', error);
    return [];
  }
}

/**
 * Получить категорию по slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
    });
    return category ? serializeCategory(category) : null;
  } catch (error) {
    console.error('[getCategoryBySlug] Ошибка:', error);
    return null;
  }
}

/**
 * Создать категорию
 */
export async function createCategory(
  data: CategoryInput
): Promise<{ success: boolean; category?: Category; error?: string }> {
  try {
    // Проверяем уникальность slug
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
    });
    
    if (existing) {
      return { success: false, error: `Категория с slug "${data.slug}" уже существует` };
    }

    const category = await prisma.category.create({
      data: {
        slug: data.slug.toLowerCase().trim(),
        name: data.name.trim(),
        emoji: data.emoji.trim(),
        color: data.color || null,
        sortOrder: data.sortOrder || 0,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/catalog');
    revalidatePath('/submit');

    return { success: true, category: serializeCategory(category) };
  } catch (error) {
    console.error('[createCategory] Ошибка:', error);
    return { success: false, error: 'Не удалось создать категорию' };
  }
}

/**
 * Обновить категорию
 */
export async function updateCategory(
  id: string,
  data: Partial<CategoryInput>
): Promise<{ success: boolean; category?: Category; error?: string }> {
  try {
    // Если меняем slug, проверяем уникальность
    if (data.slug) {
      const existing = await prisma.category.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      });
      
      if (existing) {
        return { success: false, error: `Категория с slug "${data.slug}" уже существует` };
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(data.slug && { slug: data.slug.toLowerCase().trim() }),
        ...(data.name && { name: data.name.trim() }),
        ...(data.emoji && { emoji: data.emoji.trim() }),
        ...(data.color !== undefined && { color: data.color || null }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    revalidatePath('/admin');
    revalidatePath('/catalog');
    revalidatePath('/submit');

    return { success: true, category: serializeCategory(category) };
  } catch (error) {
    console.error('[updateCategory] Ошибка:', error);
    return { success: false, error: 'Не удалось обновить категорию' };
  }
}

/**
 * Удалить категорию
 */
export async function deleteCategory(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Проверяем, есть ли эффекты с этой категорией
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return { success: false, error: 'Категория не найдена' };
    }

    const effectsCount = await prisma.effect.count({
      where: { category: category.slug },
    });

    if (effectsCount > 0) {
      return { 
        success: false, 
        error: `Нельзя удалить: ${effectsCount} эффектов используют эту категорию` 
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath('/admin');
    revalidatePath('/catalog');
    revalidatePath('/submit');

    return { success: true };
  } catch (error) {
    console.error('[deleteCategory] Ошибка:', error);
    return { success: false, error: 'Не удалось удалить категорию' };
  }
}

/**
 * Сидирование начальных категорий (для использования в seed.ts)
 */
export async function seedCategories(): Promise<void> {
  const defaultCategories: CategoryInput[] = [
    { slug: 'films', name: 'Фильмы и сериалы', emoji: '🎬', color: 'red', sortOrder: 1 },
    { slug: 'brands', name: 'Бренды и логотипы', emoji: '🏢', color: 'blue', sortOrder: 2 },
    { slug: 'music', name: 'Музыка', emoji: '🎵', color: 'purple', sortOrder: 3 },
    { slug: 'popculture', name: 'Поп-культура', emoji: '🎨', color: 'pink', sortOrder: 4 },
    { slug: 'childhood', name: 'Детство', emoji: '🧸', color: 'yellow', sortOrder: 5 },
    { slug: 'people', name: 'Люди и знаменитости', emoji: '👤', color: 'cyan', sortOrder: 6 },
    { slug: 'geography', name: 'География', emoji: '🌍', color: 'green', sortOrder: 7 },
    { slug: 'history', name: 'История', emoji: '📜', color: 'amber', sortOrder: 8 },
    { slug: 'science', name: 'Наука', emoji: '🔬', color: 'indigo', sortOrder: 9 },
    { slug: 'russian', name: 'Россия и СССР', emoji: '🇷🇺', color: 'rose', sortOrder: 10 },
    { slug: 'other', name: 'Другое', emoji: '❓', color: 'gray', sortOrder: 99 },
  ];

  console.log('📦 Сидирование категорий...');

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        emoji: cat.emoji,
        color: cat.color,
        sortOrder: cat.sortOrder,
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        emoji: cat.emoji,
        color: cat.color,
        sortOrder: cat.sortOrder || 0,
      },
    });
    console.log(`   ✅ ${cat.emoji} ${cat.name}`);
  }

  console.log('');
}

