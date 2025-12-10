import Exa from 'exa-js';

const exa = process.env.EXA_API_KEY ? new Exa(process.env.EXA_API_KEY) : null;

export interface SearchResult {
  title: string;
  url: string;
  text: string;
  publishedDate?: string;
}

function isCyrillic(text: string): boolean {
  return /[а-яА-ЯЁё]/.test(text);
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
      // УТОЧНЕННЫЙ ЗАПРОС: Добавляем контекст, чтобы не находить просто теги
      searchPrompt = `"${query}" эффект манделы разоблачение цитата откуда фраза`;
    } else {
      searchPrompt = `"${query}" mandela effect residue proof reddit forum discussion`;
    }

    const result = await exa.searchAndContents(
      searchPrompt,
      {
        type: 'neural',
        useAutoprompt: true,
        numResults: 3,
        text: true,
        // Ищем контент до 2023 года
        endPublishedDate: '2023-01-01', 
      }
    );

    return result.results.map(r => ({
      title: r.title || 'Unknown Source',
      url: r.url,
      text: r.text.slice(0, 300) + '...', // Берем начало текста для контекста
      publishedDate: r.publishedDate || undefined
    }));

  } catch (error) {
    console.error('[Exa] Search failed:', error);
    return [];
  }
}
