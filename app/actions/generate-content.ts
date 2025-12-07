'use server';

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Интерфейс для результата генерации
interface GeneratedEffectInfo {
  currentState: string;
  scientific: string;
  community: string;
  history: string;
  residue: string;
  sourceLink: string;
  scientificSource: string;
  communitySource: string;
  historySource: string;
  residueSource: string;
  category?: string;
  imageUrl?: string;
  imagePrompt?: string;
  error?: string;
}

interface GenerateResult {
  success: boolean;
  data?: GeneratedEffectInfo;
  usedModel?: string;
  error?: string;
}

interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  usedModel?: string;
  error?: string;
}

function cleanJsonResponse(rawText: string): string {
  let text = rawText.trim();
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    text = jsonBlockMatch[1].trim();
  } else if (text.startsWith('```json')) {
    text = text.slice(7).trim();
  } else if (text.startsWith('```')) {
    text = text.slice(3).trim();
  }
  if (text.endsWith('```')) {
    text = text.slice(0, -3).trim();
  }
  return text;
}

// Нормализация данных (массивы -> строки)
function normalizeToString(val: any): string {
  if (Array.isArray(val)) {
    return val.join('\n\n');
  }
  if (val === null || val === undefined) {
    return '';
  }
  return String(val);
}

// Генерация ссылок (ПРИНУДИТЕЛЬНАЯ)
function ensureUrl(url: string | undefined, title: string, suffix: string): string {
  if (url && url.startsWith('http') && url.length > 10) return url;
  // Если ссылки нет или она битая - генерируем Google Search
  return `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + suffix)}`;
}

async function generateWithDeepSeek(systemPrompt: string, userPrompt: string): Promise<string | null> {
  if (!process.env.OPENROUTER_API_KEY) return null;

  try {
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: { 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'Mandela Generator' },
    });

    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    return completion.choices[0]?.message?.content || null;
  } catch (e) {
    console.error('[DeepSeek] Error:', e);
    return null;
  }
}

async function generateWithGoogle(systemPrompt: string, userPrompt: string): Promise<string | null> {
  if (!process.env.GOOGLE_API_KEY) return null;

  try {
    const googleGenAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = googleGenAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    });
    const result = await model.generateContent(userPrompt);
    return result.response.text();
  } catch (e) {
    console.error('[Google] Error:', e);
    return null;
  }
}

export async function generateEffectData(
  title: string,
  question: string,
  variantA: string,
  variantB: string,
  options?: { generateImage?: boolean }
): Promise<GenerateResult> {
  const shouldGenerateImage = options?.generateImage !== false;
  
  console.log(`[generateEffectData] Generating for: ${title}`);

  const systemPrompt = `
ТЫ — ЭКСПЕРТ ПО ЭФФЕКТУ МАНДЕЛЫ.

Твоя задача:
1. Проанализировать эффект.
2. Написать тексты для карточки.
3. Сгенерировать VISUAL PROFILER (imagePrompt).

ПРАВИЛА ДЛЯ ТЕКСТА (Русский):
- residue: Приводи конкретные примеры (фильмы, эпизоды).

ПРАВИЛА ДЛЯ VISUAL PROFILER (English):
- Описывай ЛОЖНОЕ ВОСПОМИНАНИЕ (Вариант А).
- НЕ используй имена. Описывай внешность.
- Стиль: "documentary photography, 1990s footage style, slightly grainy, realistic lighting".

ВЕРНИ ТОЛЬКО JSON:
{
  "category": "films|brands|music|popculture|childhood|people|geography|russian|other",
  "currentState": "...",
  "scientific": "...",
  "community": "...",
  "history": "...",
  "residue": "...",
  "sourceLink": "...",
  "scientificSource": "...",
  "communitySource": "...",
  "historySource": "...",
  "residueSource": "...",
  "imagePrompt": "..."
}`;

  const userPrompt = `
ОБЪЕКТ: "${title}"
ВОПРОС: "${question}"
ВАРИАНТ А (МИФ): "${variantA}"
ВАРИАНТ Б (ФАКТ): "${variantB}"
`;

  let rawText: string | null = null;
  let usedModel = '';

  rawText = await generateWithDeepSeek(systemPrompt, userPrompt);
  if (rawText) usedModel = 'deepseek/v3';

  if (!rawText) {
    console.warn('[generateEffectData] DeepSeek failed, trying Google...');
    rawText = await generateWithGoogle(systemPrompt, userPrompt);
    if (rawText) usedModel = 'google/gemini-1.5';
  }

  if (!rawText) {
    return { success: false, error: 'Все AI модели недоступны.' };
  }

  try {
    const cleanedText = cleanJsonResponse(rawText);
    const parsed: any = JSON.parse(cleanedText);

    // Нормализация полей и ПРИНУДИТЕЛЬНАЯ генерация ссылок
    const normalizedData: GeneratedEffectInfo = {
      currentState: normalizeToString(parsed.currentState),
      scientific: normalizeToString(parsed.scientific),
      community: normalizeToString(parsed.community),
      history: normalizeToString(parsed.history),
      residue: normalizeToString(parsed.residue),
      
      // Генерируем ссылки, если их нет
      sourceLink: ensureUrl(parsed.sourceLink, title, 'Mandela Effect'),
      scientificSource: ensureUrl(parsed.scientificSource, title, 'scientific explanation'),
      communitySource: ensureUrl(parsed.communitySource, title, 'reddit theory'),
      historySource: ensureUrl(parsed.historySource, title, 'history'),
      residueSource: ensureUrl(parsed.residueSource, title, 'residue proof'),
      
      category: parsed.category || 'other',
      imagePrompt: parsed.imagePrompt,
    };

    // Генерация картинки
    if (shouldGenerateImage && normalizedData.imagePrompt) {
      const promptEncoded = encodeURIComponent(normalizedData.imagePrompt);
      const timestamp = Date.now();
      normalizedData.imageUrl = `https://image.pollinations.ai/prompt/${promptEncoded}?model=flux&width=1280&height=720&nologo=true&seed=${timestamp}`;
    }

    return { success: true, data: normalizedData, usedModel };
  } catch (e) {
    console.error('[generateEffectData] JSON Parse Error:', e);
    return { success: false, error: 'Ошибка обработки ответа AI' };
  }
}

export async function generateEffectImage(title: string, imagePrompt?: string): Promise<GenerateImageResult> {
  let finalPrompt = imagePrompt;

  if (!finalPrompt) {
    const systemPrompt = `You are a Visual Profiler. Create a detailed image prompt for Flux AI based on the title. 
    Describe the FALSE MEMORY version of the Mandela Effect.
    Do not use proper names if possible, describe physical appearance.
    Style: documentary photography, 1990s footage style, slightly grainy, realistic lighting.`;
    
    const generatedPrompt = await generateWithDeepSeek(systemPrompt, `Title: ${title}`);
    finalPrompt = generatedPrompt || `${title} mandela effect, cinematic, high detail`;
  }

  const promptEncoded = encodeURIComponent(finalPrompt);
  const timestamp = Date.now();
  const imageUrl = `https://image.pollinations.ai/prompt/${promptEncoded}?model=flux&width=1280&height=720&nologo=true&seed=${timestamp}`;

  return { success: true, imageUrl, usedModel: 'flux' };
}

export async function restyleImage(title: string, url: string) { return { success: false, error: 'Not implemented in Phase 3 yet' }; }
export async function fitImageToFormat(title: string, url: string) { return { success: false, error: 'Not implemented in Phase 3 yet' }; }
