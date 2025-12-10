/**
 * Генератор Google Dorks для поиска Residue (остатков)
 * Использует стратегии OSINT для нахождения редкого контента
 */

export interface DorkLink {
  platform: 'Google' | 'Reddit' | 'YouTube' | 'eBay' | 'Archives' | 'Blogs';
  title: string;
  url: string;
  icon?: string;
  description?: string;
}

function isCyrillic(text: string): boolean {
  return /[а-яА-ЯЁё]/.test(text);
}

export function generateResidueDorks(query: string): DorkLink[] {
  const isRu = isCyrillic(query);
  const links: DorkLink[] = [];

  if (isRu) {
    links.push({
      platform: 'Blogs',
      title: 'Форумы (Google)',
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${query}" (форум OR обсуждение OR "я помню") -статья -новости`)}`,
      description: 'Ищет живые обсуждения, исключая СМИ'
    });
    links.push({
      platform: 'Google',
      title: 'Ответы Mail.ru',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:otvet.mail.ru "${query}" before:2015`)}`,
      description: 'Упоминания до хайпа (2015)'
    });
  } else {
    links.push({
      platform: 'Reddit',
      title: 'Reddit Residue',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:reddit.com (r/Retconned OR r/MandelaEffect) "${query}" residue`)}`,
      description: 'Поиск тредов через Google (точнее)'
    });
    
    // Прямой поиск на eBay
    links.push({
      platform: 'eBay',
      title: 'eBay Поиск',
      url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`${query} vintage`)}&_sacat=0&LH_TitleDesc=0`,
      description: 'Прямой поиск винтажных лотов на eBay'
    });

    links.push({
      platform: 'Google',
      title: 'Flickr/Pinterest',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:flickr.com OR site:pinterest.com "${query}" vintage photo`)}`,
      description: 'Поиск любительских фото в архивах'
    });
  }

  links.push({
    platform: 'YouTube',
    title: 'YouTube VHS',
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} vhs commercial 90s`)}`,
    description: 'Поиск записей с ТВ'
  });

  return links;
}
