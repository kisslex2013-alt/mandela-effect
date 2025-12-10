'use server';

interface WaybackImage {
  originalUrl: string;
  archiveUrl: string;
  timestamp: string;
  mimeType: string;
}

interface WaybackResult {
  success: boolean;
  images: WaybackImage[];
  logs: string[];
}

export async function searchWaybackImages(query: string): Promise<WaybackResult> {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);

  try {
    if (!query || query.length < 2) {
      log('❌ Запрос слишком короткий');
      return { success: false, images: [], logs };
    }

    // 1. Очистка запроса (оставляем кириллицу!)
    // Убираем только спецсимволы, пробелы и двоеточия
    const cleanQuery = query.toLowerCase().replace(/[:;,"'!?]/g, '').trim(); 
    const isLatin = /^[a-z0-9\-\.]+$/.test(cleanQuery);
    
    log(`🔍 Обработанный запрос: "${cleanQuery}" (Latin: ${isLatin})`);

    let searchUrls: string[] = [];

    if (isLatin) {
      // Стратегия для английского:
      // 1. Ищем как домен (самый надежный способ найти логотипы)
      searchUrls.push(`*${cleanQuery}.com/*`);
      searchUrls.push(`${cleanQuery}.com/*`);
      // 2. Ищем как подстроку (fallback)
      searchUrls.push(`*${cleanQuery}*`);
    } else {
      // Стратегия для русского: ищем только как подстроку, но кодируем
      // Wayback плохо ищет кириллицу в URL, но попробуем
      const encoded = encodeURIComponent(cleanQuery);
      searchUrls.push(`*${encoded}*`);
    }

    let foundImages: WaybackImage[] = [];

    // Перебираем стратегии по очереди
    for (const urlPattern of searchUrls) {
      if (foundImages.length >= 10) break; // Хватит, если уже нашли

      // Фильтр: только картинки, статус 200, с 1996 по 2012 год
      // collapse=digest помогает убрать дубликаты одной и той же картинки
      const apiUrl = `https://web.archive.org/cdx/search/cdx?url=${urlPattern}&output=json&fl=original,timestamp,mimetype&filter=mimetype:image/.*&filter=statuscode:200&from=1996&to=2012&collapse=digest&limit=25`;
      
      log(`🌐 Пробуем паттерн: ${urlPattern}`);

      try {
        const response = await fetch(apiUrl, {
          headers: { 'User-Agent': 'MandelaResidueBot/2.0' },
          next: { revalidate: 60 } 
        });

        if (!response.ok) {
          log(`⚠️ Ошибка API (${response.status}) для ${urlPattern}`);
          continue;
        }

        const textData = await response.text();
        if (!textData || textData.trim().length === 0) {
           log(`💨 Пустой ответ для ${urlPattern}`);
           continue;
        }

        let data;
        try {
          data = JSON.parse(textData);
        } catch(e) { continue; }

        log(`📦 Найдено записей: ${data.length}`);

        // Парсинг
        const startIndex = (data.length > 0 && data[0][0] === 'original') ? 1 : 0;
        
        for (let i = startIndex; i < data.length; i++) {
          const [original, timestamp, mime] = data[i];

          // Жесткий фильтр мусора
          if (
             original.match(/(\.js|\.css|\.html|\.php)/) || // ошибочные mime
             original.includes('pixel') || 
             original.includes('spacer') ||
             original.includes('blank') ||
             original.includes('clear') ||
             original.includes('shim') ||
             original.includes('button') ||
             original.includes('nav') || 
             mime.includes('html') // иногда API врет про mime
          ) continue;

          foundImages.push({
            originalUrl: original,
            archiveUrl: `https://web.archive.org/web/${timestamp}if_/${original}`,
            timestamp: `${timestamp.substring(0, 4)}-${timestamp.substring(4, 6)}`,
            mimeType: mime
          });
        }
      } catch (err) {
        log(`Ошибка запроса: ${err}`);
      }
    }

    log(`✅ Итого уникальных фото: ${foundImages.length}`);
    return { success: true, images: foundImages.slice(0, 20), logs };

  } catch (error: any) {
    log(`❌ CRITICAL ERROR: ${error.message}`);
    return { success: false, images: [], logs };
  }
}
