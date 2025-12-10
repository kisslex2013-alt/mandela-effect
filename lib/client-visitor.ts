'use client';

export function getClientVisitorId(): string {
  if (typeof window === 'undefined') return '';

  // 1. Проверяем оба ключа (старый и новый), чтобы не потерять историю
  let id = localStorage.getItem('visitor-id') || localStorage.getItem('visitorId') || localStorage.getItem('mandela_visitor_id');

  // 2. Если ID нет, генерируем новый
  if (!id) {
    id = crypto.randomUUID();
  }

  // 3. Сохраняем под стандартизированным ключом 'visitor-id'
  if (localStorage.getItem('visitor-id') !== id) {
    localStorage.setItem('visitor-id', id);
  }

  return id;
}

