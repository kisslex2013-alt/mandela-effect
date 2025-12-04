/**
 * Утилиты для работы с Gemini чатами
 * Клиентские функции (без 'use server')
 */

/**
 * Проверяет, является ли URL ссылкой на Gemini чат
 */
export function isGeminiChatUrl(url: string): boolean {
  return url.includes('gemini.google.com/app/');
}

