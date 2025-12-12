/**
 * Система безопасности для внешних ссылок в комментариях
 * Whitelist доменов и валидация медиа-файлов
 */

export const MEDIA_WHITELIST = {
  // Изображения
  images: [
    // Imgur и аналогичные
    'imgur.com',
    'i.imgur.com',
    'imgbb.com',
    'i.ibb.co',
    'ibb.co',
    'postimg.cc',
    'i.postimg.cc',
    'imgbox.com',
    'i.imgbox.com',
    'postimg.org',
    'postlmg.cc',
    
    // Cloudinary и CDN
    'cloudinary.com',
    'res.cloudinary.com',
    'cdn.cloudinary.com',
    
    // Фотостоки
    'unsplash.com',
    'images.unsplash.com',
    'source.unsplash.com',
    'pexels.com',
    'images.pexels.com',
    'pixabay.com',
    'cdn.pixabay.com',
    'freepik.com',
    'img.freepik.com',
    
    // Canva (дизайн-платформа)
    'canva.com',
    'www.canva.com',
    'static-cse.canva.com',
    'media.canva.com',
    
    // Яндекс (все поддомены для изображений)
    'yandex.ru',
    'yandex.com',
    'yandex.com.tr',
    'yandex.net',
    'images.yandex.ru',
    'avatars.mds.yandex.net',
    'storage.yandex.net',
    'disk.yandex.ru',
    'disk.yandex.com',
    'getfile.dokpub.yandex.ru',
    'getfile.dokpub.yandex.com',
    'yapic.net', // Яндекс.Картинки CDN
    
    // Google (все поддомены для изображений)
    'google.com',
    'google.ru',
    'google.com.ua',
    'google.co.uk',
    'google.de',
    'images.google.com',
    'images.google.ru',
    'lh3.googleusercontent.com', // Google Photos/CDN
    'lh4.googleusercontent.com',
    'lh5.googleusercontent.com',
    'lh6.googleusercontent.com',
    'drive.google.com',
    'docs.google.com',
    'photos.google.com',
    'storage.googleapis.com',
    'gemini.google.com', // Gemini чаты и изображения
    'generativelanguage.googleapis.com', // Gemini API CDN для изображений
    
    // Другие популярные сервисы
    'flickr.com',
    'live.staticflickr.com',
    'staticflickr.com',
    'deviantart.com',
    'imageshack.us',
    'photobucket.com',
    'tinypic.com',
    'gyazo.com',
    'i.gyazo.com',
    'smugmug.com', // Премиум фотохостинг
    'cdn.smugmug.com',
    
    // Cloudflare CDN (безопасный и быстрый)
    'imagedelivery.net', // Cloudflare Images
    'cloudflare.com',
    
    // GitHub (для открытых репозиториев)
    'raw.githubusercontent.com',
    'githubusercontent.com',
    'github.com',
    
    // Облачные хранилища (только для публичных файлов)
    'dropbox.com',
    'dl.dropboxusercontent.com',
    'dropboxusercontent.com',
    'onedrive.live.com',
    'onedrive.com',
    '1drv.ms',
    'sharepoint.com', // Microsoft SharePoint
    
    // Mail.ru Cloud
    'cloud.mail.ru',
    'my.mail.ru',
    
    // Другие популярные CDN
    'cdn.discordapp.com', // Discord CDN
    'media.discordapp.net',
  ],
  
  // Видео
  videos: [
    // YouTube (все поддомены)
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be',
    'i.ytimg.com', // YouTube превью и миниатюры
    'img.youtube.com',
    'ytimg.com',
    
    // Vimeo
    'vimeo.com',
    'player.vimeo.com',
    'i.vimeocdn.com',
    
    // Dailymotion
    'dailymotion.com',
    'dai.ly',
    'dmcdn.net',
    
    // Rutube (российский аналог YouTube)
    'rutube.ru',
    'c.rutube.ru',
    
    // Яндекс (видео)
    'yandex.ru',
    'yandex.com',
    'yandex.com.tr',
    'video.yandex.ru',
    'video.yandex.com',
    
    // Google (видео)
    'google.com',
    'google.ru',
    'google.com.ua',
    'video.google.com',
    'drive.google.com', // Google Drive может содержать видео
    'youtube.googleapis.com',
    
    // Другие платформы
    'twitch.tv',
    'clips.twitch.tv',
    'player.twitch.tv',
    'bitchute.com',
    'odysee.com',
    'rumble.com',
    
    // Cloudflare Stream
    'cloudflarestream.com',
    'videodelivery.net', // Cloudflare Stream CDN
    
    // Streamable (популярный сервис для быстрой загрузки видео)
    'streamable.com',
    'cdn-cf-east.streamable.com',
    'cdn-cf-west.streamable.com',
    
    // OK.ru (Одноклассники)
    'ok.ru',
    'odnoklassniki.ru',
    'okvideo.ru',
    
    // VK Video
    'vk-cdn.net', // VK CDN для видео
  ],
  
  // Аудио
  audio: [
    // SoundCloud
    'soundcloud.com',
    'i1.sndcdn.com',
    'i2.sndcdn.com',
    'i3.sndcdn.com',
    'i4.sndcdn.com',
    
    // Spotify
    'spotify.com',
    'open.spotify.com',
    'i.scdn.co', // Spotify CDN
    
    // Bandcamp (поддомены артистов обрабатываются через includes)
    'bandcamp.com',
    
    // YouTube (аудио)
    'youtube.com',
    'youtu.be',
    'www.youtube.com',
    'm.youtube.com',
    
    // Яндекс.Музыка (все поддомены)
    'music.yandex.ru',
    'music.yandex.com',
    'music.yandex.net',
    'music.yandex.com.tr',
    
    // ВКонтакте (музыка и медиа)
    'vk.com',
    'vkontakte.ru',
    'm.vk.com',
    'vk.me',
    'userapi.com', // VK CDN
    'vk-cdn.net', // VK CDN для видео/аудио
    'vkuser.net', // VK User CDN
    'vkuserlive.net', // VK Live CDN
    
    // Другие музыкальные сервисы
    'deezer.com',
    'cdn.deezer.com',
    'music.apple.com',
    'itunes.apple.com',
    'audiomack.com',
    'mixcloud.com',
    'jamendo.com',
    'last.fm',
    'tidal.com',
    
    // SndUp (быстрая загрузка аудио без регистрации)
    'sndup.net',
    
    // Filepass (для студий звукозаписи)
    'filepass.io',
    
    // Anchor (Spotify для подкастов)
    'anchor.fm',
    'anchor.com',
    'podcasts.apple.com', // Apple Podcasts
    
    // Другие платформы для аудио
    'podbean.com',
    'audioboom.com',
    'castbox.fm',
    
    // Telegram CDN (для аудио/голосовых сообщений)
    'cdn4.telegram.org',
    'cdn5.telegram.org',
  ],
  
  // Документы/файлы
  documents: [
    'drive.google.com',
    'docs.google.com',
    'dropbox.com',
    'dl.dropbox.com',
    'onedrive.live.com',
  ],
} as const;

// Подозрительные домены (блокируем)
export const BLOCKED_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'short.link',
  'ow.ly',
  'buff.ly',
  'is.gd',
  'v.gd',
];

// Подозрительные паттерны
const SUSPICIOUS_PATTERNS = [
  /bit\.ly/i,
  /tinyurl\.com/i,
  /t\.co/i,
  /goo\.gl/i,
  /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP адреса
  /localhost/i,
  /127\.0\.0\.1/i,
  /file:\/\//i, // file:// протокол
  /javascript:/i, // javascript: протокол
  /data:/i, // data: URI (может быть опасным)
];

// Разрешенные расширения файлов
export const ALLOWED_EXTENSIONS = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  video: ['.mp4', '.webm', '.ogg', '.mov'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a'],
  document: ['.pdf', '.doc', '.docx', '.txt'],
} as const;

/**
 * Проверяет, разрешен ли домен для указанного типа медиа
 */
export function isDomainAllowed(url: string, type: 'image' | 'video' | 'audio' | 'document'): boolean {
  try {
    // Нормализуем URL перед парсингом
    const normalizedUrl = normalizeUrl(url);
    const urlObj = new URL(normalizedUrl);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Блокируем короткие ссылки
    if (BLOCKED_DOMAINS.some(blocked => hostname.includes(blocked))) {
      console.log('[isDomainAllowed] Заблокирован короткой ссылкой:', hostname);
      return false;
    }
    
    // Проверяем whitelist (преобразуем единственное число во множественное)
    const typeKey = type === 'image' ? 'images' : 
                     type === 'video' ? 'videos' : 
                     type === 'audio' ? 'audio' : 
                     type === 'document' ? 'documents' : type;
    
    const allowedDomains = MEDIA_WHITELIST[typeKey as keyof typeof MEDIA_WHITELIST];
    
    // Проверяем, что allowedDomains существует
    if (!allowedDomains || !Array.isArray(allowedDomains)) {
      console.log('[isDomainAllowed] Ошибка: allowedDomains не найден для типа:', type, 'ключ:', typeKey);
      console.log('[isDomainAllowed] Доступные ключи:', Object.keys(MEDIA_WHITELIST));
      return false;
    }
    
    // Проверяем точное совпадение или что hostname заканчивается на разрешенный домен
    const isAllowed = allowedDomains.some(domain => {
      const domainLower = domain.toLowerCase();
      // Точное совпадение
      if (hostname === domainLower) {
        return true;
      }
      // Поддомен разрешенного домена (например, avatars.mds.yandex.net для yandex.net)
      // Проверяем, что hostname заканчивается на .domain или содержит domain
      if (hostname.endsWith('.' + domainLower)) {
        return true;
      }
      // Для многоуровневых поддоменов (например, avatars.mds.yandex.net содержит yandex.net)
      // Проверяем, что hostname содержит домен как подстроку
      // Но только если это действительно поддомен, а не случайное совпадение
      if (hostname.includes(domainLower)) {
        // Убеждаемся, что это поддомен, а не случайное совпадение
        // Например, avatars.mds.yandex.net содержит yandex.net - это валидно
        const parts = hostname.split('.');
        const domainParts = domainLower.split('.');
        // Проверяем, что последние части hostname совпадают с domain
        if (parts.length >= domainParts.length) {
          const hostnameSuffix = parts.slice(-domainParts.length).join('.');
          if (hostnameSuffix === domainLower) {
            return true;
          }
        }
        // Если домен содержит точку и hostname содержит его полностью как подстроку
        // Например, avatars.mds.yandex.net содержит yandex.net
        if (domainLower.includes('.')) {
          // Проверяем, что domainLower является суффиксом hostname
          // или что hostname заканчивается на .domainLower
          if (hostname.endsWith('.' + domainLower) || hostname.endsWith(domainLower)) {
            return true;
          }
          // Проверяем, что domainLower находится в конце hostname после точки
          const index = hostname.lastIndexOf(domainLower);
          if (index > 0 && hostname[index - 1] === '.') {
            return true;
          }
        }
      }
      return false;
    });
    
    if (!isAllowed) {
      console.log('[isDomainAllowed] Домен не разрешен:', hostname, 'тип:', type);
      console.log('[isDomainAllowed] Разрешенные домены:', allowedDomains.slice(0, 10));
    }
    
    return isAllowed;
  } catch (error) {
    console.log('[isDomainAllowed] Ошибка парсинга URL:', url, error);
    // Если ошибка парсинга, пробуем нормализовать URL еще раз
    try {
      const normalized = normalizeUrl(url);
      if (normalized !== url) {
        // Рекурсивно вызываем с нормализованным URL
        return isDomainAllowed(normalized, type);
      }
    } catch (e) {
      // Если и нормализация не помогла, возвращаем false
      console.log('[isDomainAllowed] Ошибка нормализации URL:', e);
    }
    return false;
  }
}

/**
 * Проверяет URL на подозрительность
 */
export function isSuspiciousUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  
  // Проверяем паттерны
  if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(lowerUrl))) {
    return true;
  }
  
  // Проверяем на подозрительные символы
  if (url.includes('<') || url.includes('>') || url.includes('"') || url.includes("'")) {
    return true;
  }
  
  return false;
}

/**
 * Валидирует тип файла по расширению и домену
 */
export function validateFileType(url: string, expectedType: 'image' | 'video' | 'audio' | 'document'): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    // Извлекаем расширение корректно (проверяем наличие точки)
    const lastDotIndex = pathname.lastIndexOf('.');
    let extension = '';
    
    if (lastDotIndex !== -1 && lastDotIndex < pathname.length - 1) {
      // Извлекаем расширение только если точка не в конце и не в начале
      extension = pathname.substring(lastDotIndex);
      
      // Проверяем расширение
      const allowedExts = ALLOWED_EXTENSIONS[expectedType] as readonly string[];
      if (extension && allowedExts.includes(extension)) {
        return true;
      }
    }
    
    // Для некоторых сервисов расширение может отсутствовать (YouTube, Imgur, CDN)
    // Тогда проверяем только домен - если домен разрешен, считаем URL валидным
    // Это важно для сервисов вроде avatars.mds.yandex.net, которые не всегда имеют расширение в URL
    return isDomainAllowed(url, expectedType);
  } catch (error) {
    console.log('[validateFileType] Ошибка парсинга URL:', url, error);
    return false;
  }
}

/**
 * Нормализует URL: добавляет https:// если протокол отсутствует
 */
export function normalizeUrl(url: string): string {
  if (!url || url.trim() === '') return '';
  const trimmed = url.trim();
  
  // Если уже есть протокол — возвращаем как есть
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Добавляем https:// по умолчанию
  return `https://${trimmed}`;
}

