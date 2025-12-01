'use server';

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';

// Типы
export interface UserAnswer {
  effectId: string;
  title: string;
  category: string;
  selectedVariant: 'A' | 'B';
  isMandela: boolean; // true если выбрал вариант А (миф), false если вариант Б (факт)
}

export interface IdentityResultData {
  id: string;
  syncRate: number;
  archetype: string;
  description: string;
  quote: string;
  stats: Record<string, number>;
}

// === КОНФИГУРАЦИЯ AI (Скопирована для автономности) ===
interface ModelConfig {
  provider: 'google' | 'groq' | 'cerebras' | 'siliconflow' | 'hyperbolic' | 'openrouter';
  model: string;
}

const PROVIDERS: ModelConfig[] = [
  { provider: 'google', model: 'gemini-2.0-flash-exp' },
  { provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet' },
  { provider: 'openrouter', model: 'deepseek/deepseek-chat' },
  { provider: 'siliconflow', model: 'deepseek-ai/DeepSeek-V3' },
  { provider: 'hyperbolic', model: 'meta-llama/Meta-Llama-3.1-405B-Instruct' },
  { provider: 'cerebras', model: 'llama3.1-70b' },
  { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  { provider: 'siliconflow', model: 'Qwen/Qwen2.5-72B-Instruct' },
  { provider: 'openrouter', model: 'google/gemini-2.0-flash-lite-preview-02-05:free' },
];

let currentModelIndex = 0;

function cleanJsonResponse(rawText: string): string {
  let text = rawText.trim();
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    text = jsonBlockMatch[1].trim();
  } else {
    if (text.startsWith('```json')) text = text.slice(7);
    if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);
    text = text.trim();
  }
  return text;
}

// Архетипы
const ARCHETYPES = [
  { min: 90, title: "Якорь Реальности", code: "ANCHOR" },
  { min: 65, title: "Резонирующий Наблюдатель", code: "OBSERVER" },
  { min: 35, title: "Сквозной Дрифтер", code: "DRIFTER" },
  { min: 10, title: "Агент Парадокса", code: "PARADOX" },
  { min: 0,  title: "Реликт Утерянной Эпохи", code: "RELIC" },
];

export async function generateIdentity(answers: UserAnswer[]): Promise<{ success: boolean; data?: IdentityResultData; error?: string }> {
  try {
    if (!answers || answers.length === 0) {
      return { success: false, error: "Нет ответов для анализа" };
    }

    // 1. Считаем статистику
    const total = answers.length;
    const mandelaCount = answers.filter(a => a.isMandela).length;
    const realityCount = total - mandelaCount;
    
    // SyncRate: Процент совпадения с ТЕКУЩЕЙ реальностью
    const syncRate = Math.round((realityCount / total) * 100);

    // 2. Определяем Архетип
    const archetypeObj = ARCHETYPES.find(a => syncRate >= a.min) || ARCHETYPES[ARCHETYPES.length - 1];
    const archetype = archetypeObj.title;

    // 3. Готовим данные для AI
    const mandelaExamples = answers
      .filter(a => a.isMandela)
      .slice(0, 5)
      .map(a => a.title)
      .join(", ");

    console.log('[generateIdentity] 🎯 Начинаем генерацию личности');
    console.log(`[generateIdentity] SyncRate: ${syncRate}%, Архетип: ${archetype}`);
    console.log(`[generateIdentity] Примеры Mandela эффектов: ${mandelaExamples}`);

    const systemPrompt = `
Ты — ИИ системы "Хроно-Монитор". Твоя задача — сгенерировать описание профиля реальности пользователя.

ВХОДНЫЕ ДАННЫЕ:
- Уровень синхронизации с текущей реальностью: ${syncRate}%
- Архетип: "${archetype}"
- Список "Манделовских" воспоминаний (отличий от этой реальности): ${mandelaExamples || "Нет явных аномалий"}

ЗАДАЧА:
Создай уникальное описание (description) и цитату (quote) для этого человека.
Концепция: Мы живем в Мультивселенной. Если человек помнит "Люк, я твой отец" (хотя в этом мире "Нет, я твой отец") — значит, он прибыл из реальности, где Люк действительно слышал это имя. Не называй это "ошибкой". Называй это "следом другой временной линии".

Тон: Научная фантастика, мистика, Кристофер Нолан, SCP Foundation.
Длина описания: 2-3 предложения (до 250 символов).

ВЕРНИ ТОЛЬКО JSON:
{
  "description": "Текст описания...",
  "quote": "Короткая пафосная фраза..."
}
`;

    // 4. Вызываем AI (Логика перебора)
    const failedModels: string[] = [];
    let aiResult: { description: string; quote: string } | null = null;
    let usedModel = '';

    const startConfig = PROVIDERS[currentModelIndex];
    console.log(`[generateIdentity] 🎯 Начинаем с конфигурации #${currentModelIndex}: ${startConfig.provider}/${startConfig.model}`);

    for (let i = 0; i < PROVIDERS.length; i++) {
      const modelIndex = (currentModelIndex + i) % PROVIDERS.length;
      const config = PROVIDERS[modelIndex];
      
      console.log(`[generateIdentity] 🔄 Пробуем [${modelIndex}]: ${config.provider}/${config.model}...`);

      try {
        let rawText = '';
        
        // Базовые заголовки для обхода блокировок
        const defaultHeaders = {
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'Mandela Effect Identity',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };

        if (config.provider === 'google') {
          if (!process.env.GOOGLE_API_KEY) throw new Error('No API Key');
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
          const model = genAI.getGenerativeModel({ model: config.model, systemInstruction: systemPrompt });
          const result = await model.generateContent(''); // Пустой промпт, так как все в system
          rawText = result.response.text();
        } else {
            // Для OpenAI-совместимых
            let apiKey = '';
            let baseURL = '';
            
            if (config.provider === 'openrouter') {
              apiKey = process.env.OPENROUTER_API_KEY!;
              baseURL = 'https://openrouter.ai/api/v1';
            } else if (config.provider === 'siliconflow') {
              apiKey = process.env.SILICONFLOW_API_KEY!;
              baseURL = 'https://api.siliconflow.cn/v1';
            } else if (config.provider === 'cerebras') {
              apiKey = process.env.CEREBRAS_API_KEY!;
              baseURL = 'https://api.cerebras.ai/v1';
            } else if (config.provider === 'groq') {
              apiKey = process.env.GROQ_API_KEY!;
              baseURL = 'https://api.groq.com/openai/v1';
            } else if (config.provider === 'hyperbolic') {
              apiKey = process.env.HYPERBOLIC_API_KEY!;
              baseURL = 'https://api.hyperbolic.xyz/v1';
            }

            if (!apiKey) throw new Error(`No API Key for ${config.provider}`);

            const openai = new OpenAI({ 
              apiKey, 
              baseURL,
              defaultHeaders // Добавляем заголовки
            });
            
            const completion = await openai.chat.completions.create({
              model: config.model,
              messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Generate identity.' }],
              temperature: 0.7,
            });
            rawText = completion.choices[0]?.message?.content || '';
        }

        if (!rawText) throw new Error('Empty response');
        
        const cleanedJson = cleanJsonResponse(rawText);
        aiResult = JSON.parse(cleanedJson);
        
        if (aiResult?.description && aiResult?.quote) {
          currentModelIndex = modelIndex;
          usedModel = `${config.provider}/${config.model}`;
          console.log(`[generateIdentity] ✅ Успех через ${usedModel}`);
          break; // Выход из цикла
        }

      } catch (error: any) {
        console.warn(`[generateIdentity] ⚠️ Ошибка ${config.provider}/${config.model}: ${error.message}`);
        failedModels.push(`${config.provider}/${config.model}`);
        continue;
      }
    }

    // Фоллбек, если AI не справился
    if (!aiResult) {
      console.warn('[generateIdentity] ⚠️ Все AI отказали, используем локальный генератор');
      aiResult = {
        description: `Ваш разум демонстрирует уникальный паттерн (${syncRate}% синхронизации). Вы храните воспоминания, которые система классифицирует как "артефакты". Возможно, вы — наблюдатель, чья память защищена от перезаписи.`,
        quote: "Реальность — это лишь консенсус большинства."
      };
      usedModel = 'fallback-local';
    }

    // 5. Сохраняем в БД
    console.log('[generateIdentity] 💾 Сохраняем в БД...', aiResult);
    
    // ПРОВЕРКА: Существует ли prisma.identityResult?
    if (!prisma.identityResult) {
      throw new Error('Prisma Client не обновлен! Таблица IdentityResult не найдена. Запустите `npx prisma generate`.');
    }

    const result = await prisma.identityResult.create({
      data: {
        syncRate,
        archetype,
        description: aiResult.description,
        stats: { 
            total, 
            mandelaCount, 
            realityCount,
            quote: aiResult.quote // Храним цитату внутри JSON stats
        },
      }
    });

    console.log('[generateIdentity] ✅ Сохранено ID:', result.id);

    return {
      success: true,
      data: {
        id: result.id,
        syncRate,
        archetype,
        description: result.description,
        quote: aiResult.quote,
        stats: { total, mandelaCount },
      }
    };

  } catch (error: any) {
    console.error("Error generating identity:", error);
    return { success: false, error: `Ошибка генерации: ${error.message}` };
  }
}

export async function getIdentityResult(id: string) {
  try {
    const result = await prisma.identityResult.findUnique({
      where: { id },
    });

    if (!result) return { success: false, error: "Result not found" };

    // Парсим stats, так как в БД это Json
    const stats = result.stats as Record<string, any>;

    return {
      success: true,
      data: {
        id: result.id,
        syncRate: result.syncRate,
        archetype: result.archetype,
        description: result.description,
        quote: stats.quote || "",
        stats: stats
      }
    };
  } catch (error) {
    console.error("Error fetching identity:", error);
    return { success: false, error: "Error fetching identity" };
  }
}
