'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { 
  isDomainAllowed, 
  validateFileType, 
  isSuspiciousUrl, 
  normalizeUrl 
} from '@/lib/security/media-whitelist';

export interface CreateCommentData {
  effectId: string;
  visitorId: string;
  type: 'WITNESS' | 'ARCHAEOLOGIST' | 'THEORIST';
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  theoryType?: string;
}

export interface CommentResult {
  success: boolean;
  commentId?: string;
  error?: string;
}

export interface ModerateCommentResult {
  success: boolean;
  error?: string;
}

/**
 * Создать комментарий с валидацией безопасности
 */
export async function createComment(data: CreateCommentData): Promise<CommentResult> {
  try {
    // 1. Базовая валидация текста
    if (!data.text?.trim() || data.text.length < 3) {
      return { success: false, error: 'Текст комментария слишком короткий (минимум 3 символа)' };
    }
    
    if (data.text.length > 5000) {
      return { success: false, error: 'Текст комментария слишком длинный (максимум 5000 символов)' };
    }
    
    // 2. Проверка существования эффекта
    const effect = await prisma.effect.findUnique({
      where: { id: data.effectId },
      select: { id: true },
    });
    
    if (!effect) {
      return { success: false, error: 'Эффект не найден' };
    }
    
    // 3. Валидация медиа-ссылок (для всех типов комментариев, если указаны)
    if (data.imageUrl || data.videoUrl || data.audioUrl) {
      // Проверяем imageUrl
      if (data.imageUrl) {
        // Нормализуем URL перед проверкой
        let normalized: string;
        try {
          normalized = normalizeUrl(data.imageUrl.trim());
        } catch (e) {
          console.log('[createComment] Ошибка нормализации URL:', data.imageUrl, e);
          return { success: false, error: 'Некорректный формат URL' };
        }
        
        // Проверка на подозрительность
        if (isSuspiciousUrl(normalized)) {
          console.log('[createComment] Подозрительная ссылка:', normalized);
          return { success: false, error: 'Подозрительная ссылка на изображение' };
        }
        
        // Проверка домена
        const isAllowed = isDomainAllowed(normalized, 'image');
        if (!isAllowed) {
          console.log('[createComment] Домен не разрешен:', normalized);
          try {
            const urlObj = new URL(normalized);
            console.log('[createComment] Hostname:', urlObj.hostname);
          } catch (e) {
            console.log('[createComment] Ошибка парсинга URL:', e);
          }
          return { 
            success: false, 
            error: 'Разрешены только ссылки с imgur.com, imgbb.com, Яндекс (включая avatars.mds.yandex.net, disk.yandex.ru), Google (включая Google Photos), и других проверенных сервисов' 
          };
        }
        
        // Проверка типа файла
        if (!validateFileType(normalized, 'image')) {
          return { success: false, error: 'Ссылка должна вести на изображение' };
        }
        
        data.imageUrl = normalized;
      }
      
      // Аналогично для videoUrl
      if (data.videoUrl) {
        const normalized = normalizeUrl(data.videoUrl);
        
        if (isSuspiciousUrl(normalized)) {
          return { success: false, error: 'Подозрительная ссылка на видео' };
        }
        
        if (!isDomainAllowed(normalized, 'video')) {
          return { 
            success: false, 
            error: 'Разрешены только ссылки с YouTube, Rutube, Vimeo, Twitch, Яндекс/Google поиск и других проверенных сервисов' 
          };
        }
        
        if (!validateFileType(normalized, 'video')) {
          return { success: false, error: 'Ссылка должна вести на видео' };
        }
        
        data.videoUrl = normalized;
      }
      
      // Аналогично для audioUrl
      if (data.audioUrl) {
        const normalized = normalizeUrl(data.audioUrl);
        
        if (isSuspiciousUrl(normalized)) {
          return { success: false, error: 'Подозрительная ссылка на аудио' };
        }
        
        if (!isDomainAllowed(normalized, 'audio')) {
          return { 
            success: false, 
            error: 'Разрешены только ссылки с Яндекс.Музыкой, ВКонтакте, SoundCloud, Spotify и других проверенных сервисов' 
          };
        }
        
        if (!validateFileType(normalized, 'audio')) {
          return { success: false, error: 'Ссылка должна вести на аудио' };
        }
        
        data.audioUrl = normalized;
      }
    }
    
    // 4. Rate limiting (проверка количества комментариев за последний час)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentComments = await prisma.comment.count({
      where: {
        visitorId: data.visitorId,
        createdAt: { gte: oneHourAgo },
      },
    });
    
    if (recentComments >= 10) {
      return { 
        success: false, 
        error: 'Слишком много комментариев. Подождите немного перед следующим комментарием.' 
      };
    }
    
    // 5. Создание комментария (со статусом PENDING для модерации)
    const comment = await prisma.comment.create({
      data: {
        effectId: data.effectId,
        visitorId: data.visitorId,
        type: data.type,
        text: data.text.trim(),
        imageUrl: data.imageUrl || null,
        videoUrl: data.videoUrl || null,
        audioUrl: data.audioUrl || null,
        theoryType: data.theoryType || null,
        status: 'PENDING', // Требует модерации
      },
    });
    
    // Ревалидируем страницу эффекта
    revalidatePath(`/effect/${data.effectId}`);
    
    return { success: true, commentId: comment.id };
    
  } catch (error) {
    console.error('[createComment] Ошибка:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return { success: false, error: `Не удалось создать комментарий: ${errorMessage}` };
  }
}

/**
 * Получить комментарии для эффекта (только одобренные)
 */
export async function getComments(effectId: string, visitorId?: string) {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        effectId,
        status: 'APPROVED', // Только одобренные
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        text: true,
        imageUrl: true,
        videoUrl: true,
        audioUrl: true,
        theoryType: true,
        likes: true,
        dislikes: true,
        createdAt: true,
      },
    });
    
    // Получаем информацию о лайках пользователя для каждого комментария
    const commentsWithLikes = await Promise.all(
      comments.map(async (c) => {
        let userLike: boolean | null = null;
        if (visitorId) {
          const like = await prisma.commentLike.findUnique({
            where: {
              commentId_visitorId: {
                commentId: c.id,
                visitorId,
              },
            },
          });
          userLike = like ? like.isLike : null;
        }
        
        return {
          ...c,
          createdAt: c.createdAt.toISOString(),
          userLike,
        };
      })
    );
    
    return {
      success: true,
      comments: commentsWithLikes,
    };
  } catch (error) {
    console.error('[getComments] Ошибка:', error);
    return { success: false, comments: [] };
  }
}

/**
 * Модерация комментария (одобрить или отклонить)
 */
export async function moderateComment(
  commentId: string, 
  status: 'APPROVED' | 'REJECTED'
): Promise<ModerateCommentResult> {
  try {
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        status,
        moderatedAt: new Date(),
      },
      select: {
        effectId: true,
      },
    });

    // Ревалидируем страницу эффекта
    revalidatePath(`/effect/${comment.effectId}`);
    revalidatePath('/admin'); // Обновляем админку
    
    return { success: true };
  } catch (error) {
    console.error('[moderateComment] Ошибка:', error);
    return { success: false, error: 'Не удалось изменить статус комментария' };
  }
}

/**
 * Лайк/дизлайк комментария
 */
export async function toggleCommentLike(
  commentId: string,
  visitorId: string,
  isLike: boolean
): Promise<{ success: boolean; likes?: number; dislikes?: number; error?: string }> {
  try {
    // Проверяем существование комментария
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, likes: true, dislikes: true },
    });

    if (!comment) {
      return { success: false, error: 'Комментарий не найден' };
    }

    // Проверяем, есть ли уже лайк/дизлайк от этого пользователя
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_visitorId: {
          commentId,
          visitorId,
        },
      },
    });

    if (existingLike) {
      // Если пользователь уже лайкнул/дизлайкнул
      if (existingLike.isLike === isLike) {
        // Убираем лайк/дизлайк
        await prisma.commentLike.delete({
          where: { id: existingLike.id },
        });
        
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            likes: isLike ? { decrement: 1 } : undefined,
            dislikes: !isLike ? { decrement: 1 } : undefined,
          },
        });
      } else {
        // Меняем лайк на дизлайк или наоборот
        await prisma.commentLike.update({
          where: { id: existingLike.id },
          data: { isLike },
        });
        
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            likes: isLike ? { increment: 1 } : { decrement: 1 },
            dislikes: !isLike ? { increment: 1 } : { decrement: 1 },
          },
        });
      }
    } else {
      // Создаем новый лайк/дизлайк
      await prisma.commentLike.create({
        data: {
          commentId,
          visitorId,
          isLike,
        },
      });
      
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          likes: isLike ? { increment: 1 } : undefined,
          dislikes: !isLike ? { increment: 1 } : undefined,
        },
      });
    }

    // Получаем обновленные значения и effectId для ревалидации
    const updated = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { likes: true, dislikes: true, effectId: true },
    });

    if (updated?.effectId) {
      revalidatePath(`/effect/${updated.effectId}`);
    }
    
    return {
      success: true,
      likes: updated?.likes || 0,
      dislikes: updated?.dislikes || 0,
    };
  } catch (error) {
    console.error('[toggleCommentLike] Ошибка:', error);
    return { success: false, error: 'Не удалось изменить лайк' };
  }
}

/**
 * Получить информацию о лайке пользователя для комментария
 */
export async function getUserCommentLike(
  commentId: string,
  visitorId: string
): Promise<{ isLike: boolean | null }> {
  try {
    const like = await prisma.commentLike.findUnique({
      where: {
        commentId_visitorId: {
          commentId,
          visitorId,
        },
      },
    });

    return { isLike: like ? like.isLike : null };
  } catch (error) {
    return { isLike: null };
  }
}

/**
 * Получить комментарии на модерацию (для админки)
 */
export async function getPendingComments() {
  try {
    const comments = await prisma.comment.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        effect: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    
    return {
      success: true,
      comments: comments.map(c => ({
        id: c.id,
        effectId: c.effectId,
        effectTitle: c.effect.title,
        visitorId: c.visitorId,
        type: c.type,
        text: c.text,
        imageUrl: c.imageUrl,
        videoUrl: c.videoUrl,
        audioUrl: c.audioUrl,
        theoryType: c.theoryType,
        status: c.status,
        likes: c.likes,
        reports: c.reports,
        createdAt: c.createdAt.toISOString(),
        moderatedAt: c.moderatedAt?.toISOString() || null,
      })),
    };
  } catch (error) {
    console.error('[getPendingComments] Ошибка:', error);
    return { success: false, comments: [] };
  }
}

/**
 * Получить количество комментариев для эффекта (только одобренные)
 */
export async function getCommentsCount(effectId: string): Promise<number> {
  try {
    const count = await prisma.comment.count({
      where: {
        effectId,
        status: 'APPROVED',
      },
    });
    return count;
  } catch (error) {
    console.error('[getCommentsCount] Ошибка:', error);
    return 0;
  }
}

/**
 * Получить количество комментариев со ссылками (медиа) для эффекта
 */
export async function getCommentsWithMediaCount(effectId: string): Promise<number> {
  try {
    const count = await prisma.comment.count({
      where: {
        effectId,
        status: 'APPROVED',
        OR: [
          { imageUrl: { not: null } },
          { videoUrl: { not: null } },
          { audioUrl: { not: null } },
        ],
      },
    });
    return count;
  } catch (error) {
    console.error('[getCommentsWithMediaCount] Ошибка:', error);
    return 0;
  }
}

/**
 * Получить количество комментариев для нескольких эффектов (batch)
 */
export async function getCommentsCountsBatch(effectIds: string[]): Promise<Record<string, { total: number; withMedia: number }>> {
  try {
    if (effectIds.length === 0) return {};
    
    const comments = await prisma.comment.groupBy({
      by: ['effectId'],
      where: {
        effectId: { in: effectIds },
        status: 'APPROVED',
      },
      _count: {
        id: true,
      },
    });
    
    const commentsWithMedia = await prisma.comment.groupBy({
      by: ['effectId'],
      where: {
        effectId: { in: effectIds },
        status: 'APPROVED',
        OR: [
          { imageUrl: { not: null } },
          { videoUrl: { not: null } },
          { audioUrl: { not: null } },
        ],
      },
      _count: {
        id: true,
      },
    });
    
    const result: Record<string, { total: number; withMedia: number }> = {};
    
    // Инициализируем все эффекты с нулями
    effectIds.forEach(id => {
      result[id] = { total: 0, withMedia: 0 };
    });
    
    // Заполняем общее количество комментариев
    comments.forEach(item => {
      if (result[item.effectId]) {
        result[item.effectId].total = item._count.id;
      }
    });
    
    // Заполняем количество комментариев с медиа
    commentsWithMedia.forEach(item => {
      if (result[item.effectId]) {
        result[item.effectId].withMedia = item._count.id;
      }
    });
    
    return result;
  } catch (error) {
    console.error('[getCommentsCountsBatch] Ошибка:', error);
    return {};
  }
}

