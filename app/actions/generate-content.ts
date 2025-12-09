'use server';

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { STYLE_PRESETS } from '@/lib/constants';
import { searchResidue } from '@/lib/exa';

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

function normalizeToString(val: any): string {
  if (Array.isArray(val)) return val.join('\n\n');
  if (val === null || val === undefined) return '';
  return String(val);
}

function ensureUrl(url: string | undefined, title: string, suffix: string): string {
  if (url && url.startsWith('http') && url.length > 10) return url;
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
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
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
  options?: { generateImage?: boolean; style?: string }
): Promise<GenerateResult> {
  const shouldGenerateImage = options?.generateImage !== false;
  const style = options?.style || 'cinematic';
  
  console.log(`[generateEffectData] Generating for: ${title}`);

  // 1. Ищем реальные доказательства (RAG)
  let residueContext = "";
  let foundResidueLink = "";
  
  try {
    const searchResults = await searchResidue(title);
    if (searchResults.length > 0) {
      residueContext = `
      REAL FOUND EVIDENCE (Use this to write the 'residue' section):
      ${searchResults.map(r => `- [${r.publishedDate || 'Unknown Date'}] ${r.title}: ${r.text}`).join('\n')}
      `;
      foundResidueLink = searchResults[0].url;
      console.log(`[generateEffectData] Found ${searchResults.length} residue links`);
    }
  } catch (e) {
    console.warn('[generateEffectData] Exa search failed, proceeding without RAG');
  }

  const systemPrompt = `
ТЫ — ЭКСПЕРТ ПО ЭФФЕКТУ МАНДЕЛЫ.

Твоя задача:
1. Проанализировать эффект.
2. Написать тексты для карточки.
3. Сгенерировать VISUAL PROFILER (imagePrompt).

${residueContext ? 'ВАЖНО: Используй предоставленные "REAL FOUND EVIDENCE" для написания раздела "residue". Это реальные факты.' : ''}

ПРАВИЛА ДЛЯ ТЕКСТА (Русский):
- residue: Приводи конкретные примеры.
- scientific: Объясни работу памяти.

ПРАВИЛА ДЛЯ ССЫЛОК:
- Если у тебя есть реальная ссылка из контекста, используй её.
- Иначе генерируй Google Search.

ПРАВИЛА ДЛЯ VISUAL PROFILER (English):
- Описывай ЛОЖНОЕ ВОСПОМИНАНИЕ (Вариант А).
- НЕ используй имена. Описывай внешность.

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
  "residueSource": "${foundResidueLink || '...'}", 
  "imagePrompt": "..."
}`;

  const userPrompt = `ОБЪЕКТ: "${title}"\nВОПРОС: "${question}"\nВАРИАНТ А: "${variantA}"\nВАРИАНТ Б: "${variantB}"`;

  let rawText = await generateWithDeepSeek(systemPrompt, userPrompt);
  let usedModel = 'deepseek/v3';

  if (!rawText) {
    rawText = await generateWithGoogle(systemPrompt, userPrompt);
    usedModel = 'google/gemini-1.5';
  }

  if (!rawText) return { success: false, error: 'Все AI модели недоступны.' };

  try {
    const cleanedText = cleanJsonResponse(rawText);
    const parsed: any = JSON.parse(cleanedText);

    const normalizedData: GeneratedEffectInfo = {
      currentState: normalizeToString(parsed.currentState),
      scientific: normalizeToString(parsed.scientific),
      community: normalizeToString(parsed.community),
      history: normalizeToString(parsed.history),
      residue: normalizeToString(parsed.residue),
      
      sourceLink: ensureUrl(parsed.sourceLink, title, 'Mandela Effect'),
      scientificSource: ensureUrl(parsed.scientificSource, title, 'scientific explanation'),
      communitySource: ensureUrl(parsed.communitySource, title, 'reddit theory'),
      historySource: ensureUrl(parsed.historySource, title, 'history'),
      // Если Exa нашла ссылку, используем её, иначе то, что дал AI, иначе Google
      residueSource: foundResidueLink || ensureUrl(parsed.residueSource, title, 'residue proof'),
      
      category: parsed.category || 'other',
      imagePrompt: parsed.imagePrompt,
    };

    if (shouldGenerateImage && normalizedData.imagePrompt) {
      const styleModifiers = STYLE_PRESETS[style] || STYLE_PRESETS.cinematic;
      const fullPrompt = `${normalizedData.imagePrompt}, ${styleModifiers}`;
      const promptEncoded = encodeURIComponent(fullPrompt);
      const timestamp = Date.now();
      normalizedData.imageUrl = `https://image.pollinations.ai/prompt/${promptEncoded}?model=flux&width=1280&height=720&nologo=true&seed=${timestamp}`;
    }

    return { success: true, data: normalizedData, usedModel };
  } catch (e) {
    console.error('[generateEffectData] JSON Parse Error:', e);
    return { success: false, error: 'Ошибка обработки ответа AI' };
  }
}

export async function generateEffectImage(title: string, imagePrompt?: string, style: string = 'cinematic'): Promise<GenerateImageResult> {
  let finalPrompt = imagePrompt;

  if (!finalPrompt) {
    const systemPrompt = `Create a visual description for Flux AI based on title: "${title}". Describe the FALSE MEMORY version. No names.`;
    finalPrompt = await generateWithDeepSeek(systemPrompt, title) || `${title} mandela effect`;
  }

  const styleModifiers = STYLE_PRESETS[style] || STYLE_PRESETS.cinematic;
  const fullPrompt = `${finalPrompt}, ${styleModifiers}`;
  const promptEncoded = encodeURIComponent(fullPrompt);
  const timestamp = Date.now();
  const imageUrl = `https://image.pollinations.ai/prompt/${promptEncoded}?model=flux&width=1280&height=720&nologo=true&seed=${timestamp}`;

  return { success: true, imageUrl, usedModel: 'flux' };
}

export async function restyleImage(title: string, url: string) { return { success: false, error: 'Not implemented in Phase 3 yet' }; }
export async function fitImageToFormat(title: string, url: string) { return { success: false, error: 'Not implemented in Phase 3 yet' }; }
