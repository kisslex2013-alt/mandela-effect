'use server';

import OpenAI from 'openai';

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
  effects?: FoundEffect[];
  error?: string;
}

/**
 * Находит новые эффекты Манделы, которых нет в существующем списке
 */
export async function findNewEffects(
  existingTitles: string[]
): Promise<FindNewEffectsResult> {
  try {
    // Проверка API ключа
    if (!process.env.OPENROUTER_API_KEY) {
      return {
        success: false,
        error: 'OPENROUTER_API_KEY не настроен. Добавьте ключ в .env файл.',
      };
    }

    // Создаем клиент OpenRouter
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Mandela Effect Finder',
      },
    });

    // Формируем список существующих эффектов для исключения
    const exclusionList = existingTitles.length > 0 
      ? existingTitles.slice(0, 50).join(', ') // Ограничиваем до 50 для промпта
      : 'Список пуст';

    // Системный промпт
    const systemPrompt = `You are a Mandela Effect Database Archivist.

Your goal: Find 15-20 VALID Mandela Effects that are MISSING from the provided exclusion list.

Rules:
1. Search the web/knowledge base for real Mandela Effects.
2. STRICTLY EXCLUDE any effect similar to the provided exclusion list.
3. Effects can be global classics or specific niche ones - all are valid.
4. Language: Russian (for title, question, variantA, variantB), English (for sourceUrl).
5. Return ONLY a valid JSON array, no markdown, no explanations.

Format:
[
  {
    "title": "Название эффекта на русском",
    "question": "Вопрос для голосования на русском (заканчивается знаком ?)",
    "variantA": "Вариант А (ложное воспоминание)",
    "variantB": "Вариант Б (реальность)",
    "category": "films|brands|music|popculture|childhood|people|geography|history|science|russian|other",
    "sourceUrl": "https://example.com/article (optional, if found)"
  }
]

Categories:
- films: Фильмы и сериалы
- brands: Бренды и логотипы
- music: Музыка
- popculture: Поп-культура
- childhood: Детство
- people: Люди
- geography: География
- history: История
- science: Наука
- russian: Россия и СССР
- other: Другое

IMPORTANT:
- Each effect must be a REAL Mandela Effect (not made up).
- VariantA is the FALSE memory (what people remember incorrectly).
- VariantB is the REALITY (what actually exists).
- Question should be clear and end with "?".
- If you can find a source URL (Wikipedia, Reddit, article), include it.`;

    // Пользовательский промпт
    const userPrompt = `Find 15-20 Mandela Effects that are NOT in this exclusion list:

${exclusionList}

Return a JSON array with valid effects.`;

    console.log('[findNewEffects] Запрос к OpenRouter...');
    console.log('[findNewEffects] Исключаем:', existingTitles.length, 'эффектов');

    // Пробуем сначала perplexity/sonar (лучше для поиска)
    let model = 'perplexity/sonar';
    let response;

    try {
      response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });
    } catch (error: any) {
      // Если perplexity недоступна, пробуем gemini
      console.warn('[findNewEffects] Perplexity недоступна, пробуем Gemini...');
      model = 'google/gemini-2.0-flash-exp';
      
      try {
        response = await openai.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        });
      } catch (geminiError: any) {
        console.error('[findNewEffects] Ошибка Gemini:', geminiError);
        return {
          success: false,
          error: `Ошибка API: ${geminiError.message || 'Неизвестная ошибка'}`,
        };
      }
    }

    const rawText = response.choices[0]?.message?.content;
    if (!rawText) {
      return {
        success: false,
        error: 'Пустой ответ от AI',
      };
    }

    console.log('[findNewEffects] Получен ответ (первые 500 символов):', rawText.slice(0, 500));

    // Очищаем JSON от markdown обёрток
    let cleanedText = rawText.trim();
    
    // Убираем markdown блоки
    const jsonBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      cleanedText = jsonBlockMatch[1].trim();
    } else if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7).trim();
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3).trim();
    }
    
    // Убираем trailing ```
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3).trim();
    }

    // Парсим JSON
    let effects: FoundEffect[];
    try {
      effects = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('[findNewEffects] Ошибка парсинга JSON:', parseError);
      console.error('[findNewEffects] Текст для парсинга:', cleanedText);
      return {
        success: false,
        error: 'Не удалось распарсить ответ AI. Возможно, формат ответа некорректный.',
      };
    }

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

    console.log('[findNewEffects] ✅ Найдено валидных эффектов:', validEffects.length);

    return {
      success: true,
      effects: validEffects,
    };
  } catch (error: any) {
    console.error('[findNewEffects] Критическая ошибка:', error);
    return {
      success: false,
      error: error.message || 'Неизвестная ошибка при поиске эффектов',
    };
  }
}

