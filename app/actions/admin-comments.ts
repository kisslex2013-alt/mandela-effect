'use server';

/**
 * Server Actions для управления комментариями в админ-панели
 * Специальный файл для избежания Webpack module caching issues
 */

import { 
  getComments as getCommentsOriginal, 
  updateComment as updateCommentOriginal, 
  deleteComment as deleteCommentOriginal,
  type UpdateCommentResult,
  type DeleteCommentResult
} from './comments';

/**
 * Получить комментарии для эффекта (админ версия)
 */
export async function getEffectComments(effectId: string, visitorId?: string, includePending: boolean = false) {
  return await getCommentsOriginal(effectId, visitorId, includePending);
}

/**
 * Обновить комментарий (админ версия)
 */
export async function updateEffectComment(
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
 * Удалить комментарий (админ версия)
 */
export async function deleteEffectComment(commentId: string): Promise<DeleteCommentResult> {
  return await deleteCommentOriginal(commentId);
}

