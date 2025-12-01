/**
 * Скрипт для генерации тестовых голосов для проверки "Паспорта Реальности"
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * 1. Открой консоль браузера (F12) на странице localhost:3000
 * 2. Скопируй и вставь весь этот скрипт
 * 3. Нажми Enter
 * 4. Перейди на /my-memory и проверь генерацию
 * 
 * ПРИМЕЧАНИЕ: Скрипт создаст 15 голосов с разными вариантами (A и B),
 * чтобы получить реалистичный процент синхронизации (не 0% и не 100%)
 */

(function() {
  console.log('🧪 Генерация тестовых голосов для Identity...');
  
  // ШАГ 1: Получаем реальные ID эффектов из API или используем заглушки
  async function getRealEffectIds() {
    try {
      // Пробуем получить эффекты через API
      const response = await fetch('/api/effects?limit=20');
      if (response.ok) {
        const data = await response.json();
        if (data.effects && data.effects.length > 0) {
          return data.effects.map(e => e.id);
        }
      }
    } catch (e) {
      console.warn('Не удалось загрузить эффекты через API, используем заглушки');
    }
    
    // Если API не работает, пробуем получить ID из DOM (если открыт каталог)
    const effectLinks = document.querySelectorAll('a[href^="/effect/"]');
    if (effectLinks.length > 0) {
      const ids = Array.from(effectLinks)
        .map(link => link.getAttribute('href')?.replace('/effect/', ''))
        .filter(Boolean)
        .slice(0, 20);
      if (ids.length > 0) {
        console.log(`✅ Найдено ${ids.length} ID эффектов из DOM`);
        return ids;
      }
    }
    
    // Заглушки (замени на реальные ID, если знаешь)
    console.warn('⚠️ Используются заглушки. Замени на реальные ID эффектов!');
    return [
      'cmik338g2000yxriw45osi015', // Пример формата cuid
      'cmik338g2000yxriw45osi016',
      'cmik338g2000yxriw45osi017',
      'cmik338g2000yxriw45osi018',
      'cmik338g2000yxriw45osi019',
      'cmik338g2000yxriw45osi020',
      'cmik338g2000yxriw45osi021',
      'cmik338g2000yxriw45osi022',
      'cmik338g2000yxriw45osi023',
      'cmik338g2000yxriw45osi024',
      'cmik338g2000yxriw45osi025',
      'cmik338g2000yxriw45osi026',
      'cmik338g2000yxriw45osi027',
      'cmik338g2000yxriw45osi028',
      'cmik338g2000yxriw45osi029',
    ];
  }
  
  // ШАГ 2: Генерируем смешанные голоса
  async function generateTestVotes() {
    const effectIds = await getRealEffectIds();
    
    if (effectIds.length < 10) {
      console.error('❌ Недостаточно ID эффектов! Нужно минимум 10.');
      console.log('💡 Решение: Открой страницу /catalog и запусти скрипт снова');
      return;
    }
    
    // Очищаем старые тестовые голоса (опционально)
    const clearOld = confirm('Очистить старые голоса перед добавлением тестовых?');
    if (clearOld) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('voted_effect_')) {
          localStorage.removeItem(key);
        }
      }
      console.log('🗑️ Старые голоса очищены');
    }
    
    // Генерируем 15 голосов с разными вариантами
    // Примерно 40% будут 'A' (Mandela), 60% будут 'B' (Reality)
    // Это даст примерно 60% синхронизации
    const votes = {};
    const variants = ['A', 'B'];
    
    for (let i = 0; i < Math.min(15, effectIds.length); i++) {
      const effectId = effectIds[i];
      const key = `voted_effect_${effectId}`;
      
      // Смешиваем: первые 6 будут 'A', остальные 'B'
      // Или случайно: 40% шанс на 'A', 60% на 'B'
      const variant = i < 6 ? 'A' : (Math.random() < 0.3 ? 'A' : 'B');
      
      const voteData = {
        variant: variant,
        timestamp: Date.now() - (15 - i) * 1000 * 60, // Разные временные метки
        effectTitle: `Тестовый эффект ${i + 1}`
      };
      
      localStorage.setItem(key, JSON.stringify(voteData));
      votes[effectId] = variant;
    }
    
    // Подсчитываем статистику
    const aCount = Object.values(votes).filter(v => v === 'A').length;
    const bCount = Object.values(votes).filter(v => v === 'B').length;
    const syncRate = Math.round((bCount / (aCount + bCount)) * 100);
    
    console.log('✅ Тестовые голоса созданы!');
    console.log(`📊 Статистика:`);
    console.log(`   - Всего голосов: ${aCount + bCount}`);
    console.log(`   - Вариант A (Mandela): ${aCount}`);
    console.log(`   - Вариант B (Reality): ${bCount}`);
    console.log(`   - Синхронизация: ${syncRate}%`);
    console.log(`\n🎯 Теперь перейди на /my-memory и нажми "Синхронизировать Личность"`);
    
    return { votes, syncRate };
  }
  
  // Запускаем
  generateTestVotes().catch(err => {
    console.error('❌ Ошибка:', err);
  });
})();

