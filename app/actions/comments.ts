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

export interface UpdateCommentResult {
  success: boolean;
  error?: string;
}

export interface DeleteCommentResult {
  success: boolean;
  error?: string;
}

/**
 * Создать комментарий с валидацией безопасности
 */
export async function createComment(data: CreateCommentData): Promise<CommentResult> {
  // Логирование входящих данных
  console.log('[createComment] Начало обработки комментария:', {
    effectId: data.effectId,
    type: data.type,
    textLength: data.text?.length,
    imageUrl: data.imageUrl || 'null',
    videoUrl: data.videoUrl || 'null',
    audioUrl: data.audioUrl || 'null',
  });
  
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
          try {
            const urlObj = new URL(normalized);
            console.log('[createComment] ❌ Домен не разрешен:', urlObj.hostname, '| URL:', normalized);
          } catch (e) {
            console.log('[createComment] ❌ Ошибка парсинга URL:', normalized, e);
          }
          return { 
            success: false, 
            error: `Домен не разрешен. Разрешены только ссылки с imgur.com, imgbb.com, Яндекс (включая avatars.mds.yandex.net, disk.yandex.ru), Google (включая Google Photos), и других проверенных сервисов. Ваша ссылка: ${normalized}` 
          };
        }
        
        // Проверка типа файла
        const isValidFileType = validateFileType(normalized, 'image');
        if (!isValidFileType) {
          console.log('[createComment] ❌ Тип файла не валиден:', normalized);
          return { 
            success: false, 
            error: 'Ссылка должна вести на изображение (jpg, png, gif, webp, svg) или разрешенный сервис хостинга изображений' 
          };
        }
        
        console.log('[createComment] ✅ imageUrl валидирован:', normalized);
        
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
    
    console.log('[createComment] ✅ Комментарий создан успешно:', {
      commentId: comment.id,
      imageUrl: comment.imageUrl || 'null',
      videoUrl: comment.videoUrl || 'null',
      audioUrl: comment.audioUrl || 'null',
    });
    
    return { success: true, commentId: comment.id };
    
  } catch (error) {
    console.error('[createComment] Ошибка:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return { success: false, error: `Не удалось создать комментарий: ${errorMessage}` };
  }
}

/**
 * Получить комментарии для эффекта
 * @param effectId - ID эффекта
 * @param visitorId - ID посетителя (опционально)
 * @param includePending - Включить комментарии на модерации (для админа)
 */
export async function getComments(effectId: string, visitorId?: string, includePending: boolean = false) {
  try {
    // Валидация effectId
    if (!effectId || typeof effectId !== 'string' || effectId.trim() === '') {
      console.error('[getComments] Некорректный effectId:', effectId);
      return { success: false, comments: [] };
    }

    const trimmedEffectId = effectId.trim();
    
    // Логирование для отладки
    console.log('[getComments] Запрос комментариев для effectId:', trimmedEffectId, 'includePending:', includePending);
    
    const comments = await prisma.comment.findMany({
      where: {
        effectId: trimmedEffectId, // Используем обрезанный ID
        ...(includePending ? {} : { status: 'APPROVED' }), // Для админа показываем все, для пользователей только одобренные
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        effectId: true, // Добавляем effectId для проверки
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
    
    // Логирование для отладки
    console.log('[getComments] Найдено комментариев:', commentsWithLikes.length);
    commentsWithLikes.forEach((c, idx) => {
      console.log(`[getComments] Комментарий ${idx + 1}: effectId=${c.effectId}, text=${c.text?.substring(0, 50)}...`);
    });
    
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
export async function toggleCommentLike(commentId: string, visitorId: string) {
  try {
    if (!visitorId) return { success: false, error: 'No visitor ID' };

    // Проверяем, есть ли уже лайк
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_visitorId: {
          commentId,
          visitorId,
        },
      },
    });

    if (existingLike) {
      // Если есть - удаляем (дизлайк/отмена)
      await prisma.commentLike.delete({
        where: { id: existingLike.id },
      });
      
      // Обновляем счетчик в комментарии и получаем обновленные значения
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { likes: { decrement: 1 } },
        select: { likes: true, dislikes: true },
      });
      
      return { success: true, action: 'removed', likes: updatedComment.likes, dislikes: updatedComment.dislikes };
    } else {
      // Если нет - создаем
      await prisma.commentLike.create({
        data: {
          commentId,
          visitorId,
          isLike: true,
        },
      });
      
      // Обновляем счетчик и получаем обновленные значения
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { likes: { increment: 1 } },
        select: { likes: true, dislikes: true },
      });
      
      return { success: true, action: 'added', likes: updatedComment.likes, dislikes: updatedComment.dislikes };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return { success: false, error: 'Failed to toggle like' };
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

/**
 * Обновить комментарий (только для админа)
 */
export async function updateComment(
  commentId: string,
  data: {
    text?: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
    audioUrl?: string | null;
  }
): Promise<UpdateCommentResult> {
  try {
    // Валидация текста если передан
    if (data.text !== undefined) {
      if (!data.text.trim() || data.text.length < 3) {
        return { success: false, error: 'Текст комментария слишком короткий (минимум 3 символа)' };
      }
      if (data.text.length > 5000) {
        return { success: false, error: 'Текст комментария слишком длинный (максимум 5000 символов)' };
      }
    }

    // Валидация медиа-ссылок если переданы
    if (data.imageUrl) {
      const normalized = normalizeUrl(data.imageUrl);
      if (isSuspiciousUrl(normalized)) {
        return { success: false, error: 'Подозрительная ссылка на изображение' };
      }
      if (!isDomainAllowed(normalized, 'image')) {
        return { success: false, error: 'Разрешены только ссылки с проверенных сервисов' };
      }
      data.imageUrl = normalized;
    }

    if (data.videoUrl) {
      const normalized = normalizeUrl(data.videoUrl);
      if (isSuspiciousUrl(normalized)) {
        return { success: false, error: 'Подозрительная ссылка на видео' };
      }
      if (!isDomainAllowed(normalized, 'video')) {
        return { success: false, error: 'Разрешены только ссылки с проверенных сервисов' };
      }
      data.videoUrl = normalized;
    }

    if (data.audioUrl) {
      const normalized = normalizeUrl(data.audioUrl);
      if (isSuspiciousUrl(normalized)) {
        return { success: false, error: 'Подозрительная ссылка на аудио' };
      }
      if (!isDomainAllowed(normalized, 'audio')) {
        return { success: false, error: 'Разрешены только ссылки с проверенных сервисов' };
      }
      data.audioUrl = normalized;
    }

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        ...(data.text !== undefined && { text: data.text.trim() }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.audioUrl !== undefined && { audioUrl: data.audioUrl }),
      },
      select: {
        effectId: true,
      },
    });

    revalidatePath(`/effect/${comment.effectId}`);
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('[updateComment] Ошибка:', error);
    return { success: false, error: 'Не удалось обновить комментарий' };
  }
}

/**
 * Удалить комментарий (только для админа)
 */
export async function deleteComment(commentId: string): Promise<DeleteCommentResult> {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { effectId: true },
    });

    if (!comment) {
      return { success: false, error: 'Комментарий не найден' };
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    revalidatePath(`/effect/${comment.effectId}`);
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('[deleteComment] Ошибка:', error);
    return { success: false, error: 'Не удалось удалить комментарий' };
  }
}

