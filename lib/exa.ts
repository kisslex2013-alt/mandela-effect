import Exa from 'exa-js';

const exa = process.env.EXA_API_KEY ? new Exa(process.env.EXA_API_KEY) : null;

export interface SearchResult {
  title: string;
  url: string;
  text: string;
  publishedDate?: string;
  score?: number;
}

function isCyrillic(text: string): boolean {
  return /[а-яА-ЯЁё]/.test(text);
}

// Список доменов-мусорщиков и официальных СМИ
const EXCLUDED_DOMAINS = [
  "wikipedia.org",
  "dzen.ru",
  "news.mail.ru",
  "ria.ru",
  "tass.ru",
  "rbc.ru",
  "lenta.ru",
  "gazeta.ru",
  "babyblog.ru",
  "woman.ru",
  "pikabu.ru", // Иногда полезно, но часто мусор
  "irecommend.ru",
  "otzovik.com"
];

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500) + (text.length > 500 ? '...' : '');
}

/**
 * Проверяет, насколько результат релевантен запросу.
 * Требует наличия > 60% слов из запроса в тексте результата.
 */
function isRelevanceHigh(query: string, resultText: string, resultTitle: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(w => w.length > 2);
  
  const queryWords = normalize(query);
  if (queryWords.length === 0) return true;

  const contentWords = new Set([...normalize(resultTitle), ...normalize(resultText)]);
  
  // Считаем, сколько слов из запроса найдено в тексте
  let foundCount = 0;
  for (const word of queryWords) {
    if (contentWords.has(word)) {
      foundCount++;
    }
  }

  const overlapRatio = foundCount / queryWords.length;
  // Если запрос короткий (1-2 слова), требуем 100% совпадения. Если длинный - хотя бы 60%.
  const threshold = queryWords.length <= 2 ? 0.99 : 0.6;
  
  console.log(`[Relevance] "${query}" vs Title: "${resultTitle.substring(0, 20)}..." -> Match: ${foundCount}/${queryWords.length} (${overlapRatio.toFixed(2)})`);
  
  return overlapRatio >= threshold;
}

export async function searchResidue(query: string): Promise<SearchResult[]> {
  if (!exa) {
    console.warn('[Exa] API Key missing');
    return [];
  }

  try {
    console.log(`[Exa] Searching residue for: ${query}`);
    
    let searchPrompt = '';
    
    if (isCyrillic(query)) {
      // Добавляем контекст "эффект манделы", чтобы искать именно феномен, а не бытовые обсуждения
      searchPrompt = `"${query}" эффект манделы обсуждение цитата`;
    } else {
      searchPrompt = `"${query}" mandela effect residue proof`;
    }

    const result = await exa.searchAndContents(
      searchPrompt,
      {
        type: 'neural',
        useAutoprompt: true,
        numResults: 8, // Берем больше, так как фильтр стал строже
        text: true,
        endPublishedDate: '2023-01-01',
        excludeDomains: EXCLUDED_DOMAINS,
      }
    );

    // Строгая фильтрация
    const validResults = result.results
      .filter(r => isRelevanceHigh(query, r.text, r.title || ''))
      .slice(0, 3)
      .map(r => ({
        title: r.title || 'Unknown Source',
        url: r.url,
        text: cleanText(r.text),
        publishedDate: r.publishedDate || undefined,
        score: r.score
      }));
      
    console.log(`[Exa] Found ${validResults.length} valid residues after strict filtering`);
    return validResults;

  } catch (error) {
    console.error('[Exa] Search failed:', error);
    return [];
  }
}
