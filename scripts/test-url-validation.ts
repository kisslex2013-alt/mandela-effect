/**
 * Тестовый скрипт для проверки валидации URL
 * Запуск: npm run test-url-validation
 */

import { isDomainAllowed, validateFileType, isSuspiciousUrl, normalizeUrl } from '../lib/security/media-whitelist';

// Тестовые URL из комментариев
const testUrls = [
  'https://avatars.mds.yandex.net/get-zen_doc/123/...',
  'https://yandex.ru/images/search?text=test',
  'https://google.com/image.jpg',
  'https://example.com/image.png', // Не разрешенный домен
  'https://i.imgur.com/abc123.jpg',
  'https://imgur.com/abc123', // Без расширения
  'https://disk.yandex.ru/i/abc123',
  'https://drive.google.com/file/d/abc123/view',
];

console.log('\n🔍 Тестирование валидации URL:\n');

testUrls.forEach((url, index) => {
  console.log(`\n${index + 1}. URL: ${url}`);
  
  try {
    const normalized = normalizeUrl(url);
    console.log(`   Нормализованный: ${normalized}`);
    
    const suspicious = isSuspiciousUrl(normalized);
    console.log(`   Подозрительный: ${suspicious ? '❌ ДА' : '✅ НЕТ'}`);
    
    if (suspicious) {
      console.log(`   ⚠️  ПРОПУЩЕН из-за подозрительности`);
      return;
    }
    
    const domainAllowed = isDomainAllowed(normalized, 'image');
    console.log(`   Домен разрешен: ${domainAllowed ? '✅ ДА' : '❌ НЕТ'}`);
    
    const fileTypeValid = validateFileType(normalized, 'image');
    console.log(`   Тип файла валиден: ${fileTypeValid ? '✅ ДА' : '❌ НЕТ'}`);
    
    if (domainAllowed && fileTypeValid) {
      console.log(`   ✅ РЕЗУЛЬТАТ: URL ПРИНЯТ`);
    } else {
      console.log(`   ❌ РЕЗУЛЬТАТ: URL ОТКЛОНЕН`);
    }
    
  } catch (error) {
    console.log(`   ❌ ОШИБКА: ${error}`);
  }
});

console.log('\n✅ Тестирование завершено\n');

