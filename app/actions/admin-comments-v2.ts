'use server';

/**
 * Server Actions для управления комментариями в админ-панели (v2)
 * 
 * ВЕРСИЯ 2: Создан для обхода Webpack module caching issues
 * 
 * Проблема: Webpack агрессивно кэширует Server Actions по их module ID.
 * Решение: Создан новый файл с уникальными именами функций и версией в имени,
 * чтобы заставить Webpack создать новые module IDs.
 */

import { 
  getComments as getCommentsOriginal, 
  updateComment as updateCommentOriginal, 
  deleteComment as deleteCommentOriginal,
  type UpdateCommentResult,
  type DeleteCommentResult
} from './comments';

/**
 * Получить комментарии для эффекта (админ версия v2)
 * Уникальное имя функции для обхода Webpack кэша
 */
export async function adminGetEffectComments(effectId: string, visitorId?: string, includePending: boolean = false) {
  return await getCommentsOriginal(effectId, visitorId, includePending);
}

/**
 * Обновить комментарий (админ версия v2)
 * Уникальное имя функции для обхода Webpack кэша
 */
export async function adminUpdateEffectComment(
  commentId: string,
  data: {
    text?: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
    audioUrl?: string | null;
  }
): Promise<UpdateCommentResult> {
  return await updateCommentOriginal(commentId, data);
}

/**
 * Удалить комментарий (админ версия v2)
 * Уникальное имя функции для обхода Webpack кэша
 */
export async function adminDeleteEffectComment(commentId: string): Promise<DeleteCommentResult> {
  return await deleteCommentOriginal(commentId);
}

