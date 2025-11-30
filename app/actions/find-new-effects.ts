'use server';

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface FoundEffect {
  title: string;
  question: string;
  variantA: string;
  variantB: string;
  category: string;
  sourceUrl?: string;
}

interface FindNewEffectsResult {
  success: boolean;
  data?: FoundEffect[];
  usedModel?: string;
  error?: string;
}

/**
 * Очищает текст от Markdown-обёрток (```json ... ```)
 * Надёжно извлекает JSON из ответа AI
 */
function cleanJsonResponse(rawText: string): string {
  let text = rawText.trim();
  
  // Способ 1: Регулярка для извлечения JSON из блока ```json ... ```
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    text = jsonBlockMatch[1].trim();
  } else if (text.startsWith('```json')) {
    text = text.slice(7).trim();
  } else if (text.startsWith('```')) {
    text = text.slice(3).trim();
  }
  
  // Убираем trailing ```
  if (text.endsWith('```')) {
    text = text.slice(0, -3).trim();
  }
  
  return text;
}

/**
 * Форматирует текст в JSON через Google Gemini
 */
async function formatTextToJson(rawText: string): Promise<FindNewEffectsResult> {
  if (!process.env.GOOGLE_API_KEY) {
    return {
      success: false,
      error: 'GOOGLE_API_KEY не настроен для форматирования',
    };
  }

  try {
    console.log('[findNewEffects] 🔄 Форматирую текст в JSON через Google Gemini...');
    
    const googleGenAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = googleGenAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const formatPrompt = `I have a raw text describing Mandela Effects. Convert it into a STRICT JSON array.

Schema: [{ title, question, variantA, variantB, category, sourceUrl }]

Rules:
- title: Russian text
- question: Russian text ending with "?"
- variantA: Russian text (FALSE memory)
- variantB: Russian text (REALITY)
- category: one of: films, brands, music, popculture, childhood, people, geography, history, science, russian, other
- sourceUrl: optional string (URL if found)

Raw text:

${rawText}`;

    const result = await model.generateContent(formatPrompt);

    const response = await result.response;
    const jsonText = response.text();

    if (jsonText) {
      console.log('[findNewEffects] ✅ Google отформатировал JSON');
      const effects = JSON.parse(jsonText);
      const validationResult = validateAndNormalizeEffects(effects);
      
      if (validationResult.success) {
        return {
          ...validationResult,
          usedModel: 'perplexity/sonar + google/gemini-2.0-flash',
        };
      }
      
      return validationResult;
    }

    return {
      success: false,
      error: 'Google вернул пустой ответ при форматировании',
    };
  } catch (error: any) {
    console.error('[findNewEffects] ❌ Ошибка форматирования через Google:', error);
    return {
      success: false,
      error: `Ошибка форматирования: ${error.message || 'Неизвестная ошибка'}`,
    };
  }
}

/**
 * Форматирует текст в JSON через Llama (OpenRouter) - fallback
 */
async function formatTextToJsonLlama(rawText: string): Promise<FindNewEffectsResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    return {
      success: false,
      error: 'OPENROUTER_API_KEY не настроен для форматирования',
    };
  }

  try {
    console.log('[findNewEffects] 🔄 Форматирую текст в JSON через Llama (fallback)...');
    
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Mandela Effect Finder',
      },
    });

    const formatPrompt = `Convert this raw text about Mandela Effects into a STRICT JSON array.

Schema: [{ title, question, variantA, variantB, category, sourceUrl }]

Rules:
- title: Russian text
- question: Russian text ending with "?"
- variantA: Russian text (FALSE memory)
- variantB: Russian text (REALITY)
- category: one of: films, brands, music, popculture, childhood, people, geography, history, science, russian, other
- sourceUrl: optional string (URL if found)

Return ONLY valid JSON array, no markdown, no explanations.

Raw text:

${rawText}`;

    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'user', content: formatPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const jsonText = completion.choices[0]?.message?.content;
    if (jsonText) {
      console.log('[findNewEffects] ✅ Llama отформатировал JSON');
      const cleanedText = cleanJsonResponse(jsonText);
      const effects = JSON.parse(cleanedText);
      const validationResult = validateAndNormalizeEffects(effects);
      
      if (validationResult.success) {
        return {
          ...validationResult,
          usedModel: 'perplexity/sonar + llama-3.3-70b',
        };
      }
      
      return validationResult;
    }

    return {
      success: false,
      error: 'Llama вернул пустой ответ при форматировании',
    };
  } catch (error: any) {
    console.error('[findNewEffects] ❌ Ошибка форматирования через Llama:', error);
    return {
      success: false,
      error: `Ошибка форматирования: ${error.message || 'Неизвестная ошибка'}`,
    };
  }
}

/**
 * Находит новые эффекты Манделы, которых нет в существующем списке
 * Использует паттерн "Search then Format": Perplexity ищет, Google форматирует
 */
export async function findNewEffects(
  existingTitles: string[]
): Promise<FindNewEffectsResult> {
  try {
    // Формируем список существующих эффектов для исключения
    const exclusionList = existingTitles.length > 0 
      ? existingTitles.slice(0, 50).join(', ') // Ограничиваем до 50 для промпта
      : 'Список пуст';

    console.log('[findNewEffects] 🕵️ Начало поиска новых эффектов...');
    console.log('[findNewEffects] Исключаем:', existingTitles.length, 'эффектов');

    // ============================================
    // ЭТАП 1: Поиск через Perplexity (OpenRouter)
    // ============================================
    let searchText: string | null = null;

    if (process.env.OPENROUTER_API_KEY) {
      try {
        console.log('[findNewEffects] 🕵️ ЭТАП 1: Запуск Perplexity (Sonar) для поиска...');
        
        const openai = new OpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: process.env.OPENROUTER_API_KEY,
          defaultHeaders: {
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'Mandela Effect Finder',
          },
        });

        // Промпт для поиска (без требования JSON)
        const searchSystemPrompt = `You are a detailed Researcher with access to the Internet.

Your goal: Search the internet for real Mandela Effects and return a detailed TEXT list with descriptions and URLs.

CRITICAL INSTRUCTIONS:
1. USE INTERNET SEARCH to find real, documented Mandela Effects from:
   - Reddit r/MandelaEffect
   - Wikipedia articles
   - News articles and blogs
   - YouTube videos
   - Online forums
2. STRICTLY EXCLUDE any effect similar to the provided exclusion list.
3. Effects can be global classics or specific niche ones - all are valid.
4. For each effect, include:
   - Title (in Russian)
   - Question (in Russian, ending with "?")
   - Variant A (FALSE memory, in Russian)
   - Variant B (REALITY, in Russian)
   - Category (films, brands, music, popculture, childhood, people, geography, history, science, russian, other)
   - Source URL (if found)

Do NOT worry about JSON formatting yet. Just return detailed text descriptions.`;

        const searchUserPrompt = `Find 15-20 interesting Mandela Effects that are NOT in this list:

${exclusionList}

Include source URLs when possible. Return detailed text descriptions.`;

        const completion = await openai.chat.completions.create({
          model: 'perplexity/sonar',
          messages: [
            { role: 'system', content: searchSystemPrompt },
            { role: 'user', content: searchUserPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        });

        const rawText = completion.choices[0]?.message?.content;
        if (rawText && rawText.trim().length > 0) {
          searchText = rawText;
          console.log('[findNewEffects] ✅ Perplexity вернул текст для форматирования (первые 500 символов):', rawText.slice(0, 500));
        }
      } catch (error: any) {
        // Проверяем, если это ошибка оплаты/лимита (402, 429)
        const isPaymentError = error.status === 402 || error.status === 429 || 
                              error.message?.includes('402') || error.message?.includes('429');
        
        if (isPaymentError) {
          console.warn('[findNewEffects] ⚠️ Perplexity недоступна (402/429), переходим на Google для поиска:', error.message || error);
        } else {
          console.warn('[findNewEffects] ⚠️ Perplexity не сработала, переходим на Google для поиска:', error.message || error);
        }
      }
    }

    // ============================================
    // ЭТАП 2: Форматирование через Google
    // ============================================
    if (searchText && process.env.GOOGLE_API_KEY) {
      console.log('[findNewEffects] 🔄 ЭТАП 2: Форматирую текст в JSON через Google...');
      
      const formatResult = await formatTextToJson(searchText);
      if (formatResult.success) {
        return formatResult;
      }

      // Если Google не смог отформатировать, пробуем Llama
      console.log('[findNewEffects] ⚠️ Google не смог отформатировать, пробуем Llama...');
      if (process.env.OPENROUTER_API_KEY) {
        const llamaResult = await formatTextToJsonLlama(searchText);
        if (llamaResult.success) {
          return llamaResult;
        }
      }
    }

    // ============================================
    // ЭТАП 3: Fallback - Поиск через Google (если Perplexity не сработала)
    // ============================================
    if (process.env.GOOGLE_API_KEY) {
      try {
        console.log('[findNewEffects] 🔄 ЭТАП 3: Fallback - поиск через Google Gemini...');
        
        const googleGenAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        
        const fallbackSystemPrompt = `You are a Mandela Effect Researcher.

Your goal: Find 15-20 VALID Mandela Effects that are MISSING from the provided exclusion list.

Rules:
1. STRICTLY EXCLUDE any effect similar to the provided exclusion list.
2. Effects can be global classics or specific niche ones - all are valid.
3. Language: Russian (for title, question, variantA, variantB), English (for sourceUrl).
4. Return ONLY a valid JSON array.

Format:
[
  {
    "title": "Название эффекта на русском",
    "question": "Вопрос для голосования на русском (заканчивается знаком ?)",
    "variantA": "Вариант А (ложное воспоминание)",
    "variantB": "Вариант Б (реальность)",
    "category": "films|brands|music|popculture|childhood|people|geography|history|science|russian|other",
    "sourceUrl": "https://example.com/article (optional)"
  }
]`;

        const fallbackUserPrompt = `Find 15-20 Mandela Effects that are NOT in this exclusion list:

${exclusionList}

Return a JSON array with valid effects.`;

        const model = googleGenAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          systemInstruction: fallbackSystemPrompt,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const result = await model.generateContent(fallbackUserPrompt);

        const response = await result.response;
        const jsonText = response.text();

        if (jsonText) {
          console.log('[findNewEffects] ✅ Google вернул JSON (fallback)');
          const effects = JSON.parse(jsonText);
          const validationResult = validateAndNormalizeEffects(effects);
          
          if (validationResult.success) {
            return {
              ...validationResult,
              usedModel: 'google/gemini-2.0-flash',
            };
          }
          
          return validationResult;
        }
      } catch (error: any) {
        console.error('[findNewEffects] ❌ Ошибка Google (fallback):', error);
        return {
          success: false,
          error: `Ошибка Google API: ${error.message || 'Неизвестная ошибка'}`,
        };
      }
    }

    return {
      success: false,
      error: 'Не настроен ни OPENROUTER_API_KEY, ни GOOGLE_API_KEY. Добавьте хотя бы один ключ в .env файл.',
    };
  } catch (error: any) {
    console.error('[findNewEffects] Критическая ошибка:', error);
    return {
      success: false,
      error: error.message || 'Неизвестная ошибка при поиске эффектов',
    };
  }
}

/**
 * Валидирует и нормализует массив эффектов
 */
function validateAndNormalizeEffects(effects: any): FindNewEffectsResult {
  // Валидация: должен быть массив
  if (!Array.isArray(effects)) {
    return {
      success: false,
      error: 'AI вернул не массив. Ожидался массив объектов.',
    };
  }

  // Валидация и нормализация каждого эффекта
  const validEffects: FoundEffect[] = [];
  for (const effect of effects) {
    if (
      typeof effect.title === 'string' &&
      typeof effect.question === 'string' &&
      typeof effect.variantA === 'string' &&
      typeof effect.variantB === 'string' &&
      typeof effect.category === 'string' &&
      effect.title.trim().length > 0 &&
      effect.question.trim().length > 0 &&
      effect.variantA.trim().length > 0 &&
      effect.variantB.trim().length > 0
    ) {
      // Нормализуем категорию (если невалидная - ставим other)
      const validCategories = ['films', 'brands', 'music', 'popculture', 'childhood', 'people', 'geography', 'history', 'science', 'russian', 'other'];
      const category = validCategories.includes(effect.category) ? effect.category : 'other';
      
      validEffects.push({
        title: effect.title.trim(),
        question: effect.question.trim(),
        variantA: effect.variantA.trim(),
        variantB: effect.variantB.trim(),
        category,
        sourceUrl: typeof effect.sourceUrl === 'string' ? effect.sourceUrl.trim() : undefined,
      });
    }
  }

  if (validEffects.length === 0) {
    return {
      success: false,
      error: 'AI не вернул ни одного валидного эффекта.',
    };
  }

  return {
    success: true,
    data: validEffects,
  };
}

