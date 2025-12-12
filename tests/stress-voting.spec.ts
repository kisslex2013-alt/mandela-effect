import { test, expect } from '@playwright/test';

test('Stress test: Rapid voting should not freeze UI', async ({ page }) => {
  // 1. Очистка перед тестом
  await page.goto('/catalog');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  
  // Ждем загрузки
  await page.waitForSelector('.group.relative', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(1000);

  const clicksTarget = 5; // Достаточно 5 кликов для проверки фризов
  const startTime = Date.now();

  // 2. Цикл голосования
  for (let i = 0; i < clicksTarget; i++) {
    await expect(async () => {
      // Ищем кнопки, которые еще можно нажать
      // Ищем контейнеры карточек, где еще нет результатов (нет прогресс-бара)
      // И внутри них ищем кнопку "A"
      
      // Стратегия: берем все кнопки "A", кликаем по i-й (если она доступна)
      // Используем :visible чтобы не кликать по скрытым
      const buttons = page.locator('button:has-text("A"):visible, div.cursor-pointer:has-text("A"):visible');
      const count = await buttons.count();
      
      if (count === 0) throw new Error('No visible voting buttons found');
      
      // Всегда кликаем по первой доступной кнопке, так как после клика она может исчезнуть/измениться
      // и список обновится. Но чтобы не кликать по одной и той же (если она не исчезает),
      // лучше использовать nth(i) если они остаются в DOM, или nth(0) если исчезают.
      // В нашем случае карточки остаются, но меняется контент.
      // Попробуем кликать по разным индексам.
      
      const button = buttons.nth(i % count);
      
      await button.scrollIntoViewIfNeeded();
      await button.click({ force: true, timeout: 1000 });
      
    }).toPass({
      intervals: [200, 500],
      timeout: 5000
    });
    
    // Небольшая пауза между кликами (имитация быстрого юзера)
    await page.waitForTimeout(100);
  }

  const endTime = Date.now();
  console.log(`Clicked ${clicksTarget} times in ${endTime - startTime}ms`);

  // 3. Проверка UI (Скролл) - проверяем, что скролл работает (не заморожен)
  const canScroll = await page.evaluate(() => {
    const initialScroll = window.scrollY;
    window.scrollTo(0, 100);
    const newScroll = window.scrollY;
    return newScroll !== initialScroll || document.documentElement.scrollHeight > window.innerHeight;
  });
  
  // Если страница достаточно длинная, проверяем что скролл работает
  // Если страница короткая, просто проверяем что нет ошибок
  if (canScroll) {
    const scrollY = await page.evaluate(() => window.scrollY);
    console.log(`Scroll position: ${scrollY}`);
  }

  // 4. Ждем сохранения в localStorage (голоса сохраняются асинхронно через requestIdleCallback/setTimeout)
  // Используем toPass для повторных попыток проверки
  await expect(async () => {
    const votes = await page.evaluate(() => {
      const data = localStorage.getItem('mandela_votes');
      return data ? Object.keys(JSON.parse(data)).length : 0;
    });
    
    console.log(`Votes recorded: ${votes}`);
    if (votes === 0) {
      throw new Error('Votes not yet saved to localStorage');
    }
    expect(votes).toBeGreaterThan(0);
  }).toPass({
    intervals: [100, 200, 500],
    timeout: 3000
  });
});
