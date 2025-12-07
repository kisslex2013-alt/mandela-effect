'use server';

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SECTORS } from '@/lib/constants';

interface FoundEffect {
  title: string;
  question: string;
  variantA: string;
  variantB: string;
  category: string;
  sourceUrl?: string;
  residueSource?: string;
  visualPrompt?: string;
}

interface FindNewEffectsResult {
  success: boolean;
  data?: FoundEffect[];
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

async function formatTextToJsonDeepSeek(rawText: string): Promise<FindNewEffectsResult> {
  if (!process.env.OPENROUTER_API_KEY) return { success: false, error: 'No OpenRouter Key' };
  
  try {
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: { 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'Mandela Formatter' },
    });

    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a strict JSON formatter. Return ONLY a valid JSON array. No markdown.' },
        { role: 'user', content: `Convert this text to JSON array with schema:
        [{ 
          "title": "Russian title (Short)", 
          "question": "Russian question?", 
          "variantA": "False memory (Russian)", 
          "variantB": "Reality (Russian)", 
          "category": "films|brands|music|popculture|childhood|people|geography|history|science|russian|other", 
          "sourceUrl": "url",
          "residueSource": "url",
          "visualPrompt": "Visual description in English (NO NAMES)"
        }]
        
        Text:
        ${rawText}` }
      ],
      temperature: 0.1,
    });

    const jsonText = completion.choices[0]?.message?.content;
    if (jsonText) {
      const effects = JSON.parse(cleanJsonResponse(jsonText));
      return validateAndNormalizeEffects(effects, 'deepseek/deepseek-chat');
    }
    return { success: false, error: 'Empty DeepSeek response' };
  } catch (e: any) {
    console.error('[DeepSeek] Error:', e);
    return { success: false, error: e.message };
  }
}

async function formatTextToJsonGoogle(rawText: string): Promise<FindNewEffectsResult> {
  if (!process.env.GOOGLE_API_KEY) return { success: false, error: 'No Google Key' };

  try {
    const googleGenAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = googleGenAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const formatPrompt = `Convert text to JSON array. Schema: [{ title, question, variantA, variantB, category, sourceUrl, residueSource, visualPrompt }]. Text: ${rawText}`;

    const result = await model.generateContent(formatPrompt);
    const jsonText = result.response.text();
    if (jsonText) {
      const effects = JSON.parse(jsonText);
      return validateAndNormalizeEffects(effects, 'google/gemini-1.5-flash');
    }
    return { success: false, error: 'Empty Google response' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function findNewEffects(existingTitles: string[], sector?: string): Promise<FindNewEffectsResult> {
  try {
    const exclusionList = existingTitles.length > 0 ? existingTitles.slice(0, 50).join(', ') : 'None';
    
    // Логика выбора сектора
    let searchTopic = sector;
    if (!searchTopic || searchTopic.startsWith("Авто")) {
      const randomTopics = ["Советское кино", "Логотипы 90-х", "Цитаты из фильмов", "География", "Знаменитости", "Еда и напитки"];
      searchTopic = randomTopics[Math.floor(Math.random() * randomTopics.length)];
    }

    console.log(`[findNewEffects] 📡 Сканирование темы: "${searchTopic}"`);

    let searchText: string | null = null;

    // 1. Поиск через Perplexity
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const openai = new OpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: process.env.OPENROUTER_API_KEY,
          defaultHeaders: { 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'Mandela Hunter' },
        });

        const searchSystemPrompt = `You are a Mandela Effect Researcher.
Your goal: Find 5 specific Mandela Effects related to: "${searchTopic}".

CRITICAL RULES:
1. EXCLUDE: ${exclusionList}.
2. Language: Russian (for content), English (for visual prompt).
3. Structure for each effect:
   - Title: Short Russian title.
   - Question: Short Russian question.
   - Variant A (False): What people wrongly remember.
   - Variant B (Reality): What is actually true.
   - Visual: Detailed physical description for AI image generation (NO NAMES).

Find 5 best examples.`;

        const completion = await openai.chat.completions.create({
          model: 'perplexity/sonar',
          messages: [{ role: 'system', content: searchSystemPrompt }, { role: 'user', content: 'Start scanning.' }],
          temperature: 0.7,
        });

        searchText = completion.choices[0]?.message?.content;
      } catch (e) {
        console.warn('[findNewEffects] Perplexity failed, switching to fallback...');
      }
    }

    // 2. Fallback: Google Gemini
    if (!searchText && process.env.GOOGLE_API_KEY) {
      const googleGenAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const model = googleGenAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(`Find 5 Mandela Effects about "${searchTopic}". Exclude: ${exclusionList}. Return detailed text with Russian titles.`);
      searchText = result.response.text();
    }

    if (searchText) {
      const deepSeekResult = await formatTextToJsonDeepSeek(searchText);
      if (deepSeekResult.success) return deepSeekResult;
      return await formatTextToJsonGoogle(searchText);
    }

    return { success: false, error: 'No search results found.' };

  } catch (error: any) {
    console.error('[findNewEffects] Critical error:', error);
    return { success: false, error: error.message };
  }
}

function validateAndNormalizeEffects(effects: any, modelName: string): FindNewEffectsResult {
  if (!Array.isArray(effects)) return { success: false, error: 'Invalid format' };

  const validEffects: FoundEffect[] = [];
  for (const effect of effects) {
    if (effect.title && effect.variantA && effect.variantB) {
      validEffects.push({
        title: effect.title.trim(),
        question: effect.question?.trim() || 'Как это было?',
        variantA: effect.variantA.trim(),
        variantB: effect.variantB.trim(),
        category: effect.category || 'other',
        sourceUrl: effect.sourceUrl,
        residueSource: effect.residueSource,
        visualPrompt: effect.visualPrompt
      });
    }
  }

  return { success: true, data: validEffects, usedModel: modelName };
}
