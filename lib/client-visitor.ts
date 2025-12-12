'use client';

export function getClientVisitorId(): string {
  if (typeof window === 'undefined') return '';

  // #region agent log
  const startTime = performance.now();
  // #endregion
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
  // #region agent log
  const duration = performance.now() - startTime;
  if (duration > 10) {
    fetch('http://127.0.0.1:7242/ingest/2b04a9b9-bf85-49f7-8069-5a78c9435350',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client-visitor.ts:3',message:'getClientVisitorId SLOW',data:{duration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
  }
  // #endregion

  return id;
}

