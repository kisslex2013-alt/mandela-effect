'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface Category {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  color?: string | null;
  sortOrder: number;
}

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return { success: true, categories };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

export async function createCategory(data: { name: string; slug: string; emoji: string; color?: string; sortOrder?: number }) {
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        emoji: data.emoji || 'help-circle', // Дефолтная иконка
        color: data.color,
        sortOrder: data.sortOrder || 0,
      },
    });
    
    revalidatePath('/admin');
    revalidatePath('/catalog');
    return { success: true, category };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: 'Failed to create category' };
  }
}

export async function updateCategory(id: string, data: { name?: string; slug?: string; emoji?: string; color?: string; sortOrder?: number }) {
  try {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.emoji !== undefined) updateData.emoji = data.emoji; // Обновляем иконку
    if (data.color !== undefined) updateData.color = data.color;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });
    
    revalidatePath('/admin');
    revalidatePath('/catalog');
    return { success: true, category };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: 'Failed to update category' };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({
      where: { id },
    });
    
    revalidatePath('/admin');
    revalidatePath('/catalog');
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Failed to delete category' };
  }
}
