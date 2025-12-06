'use client';

import { useEffect } from 'react';

// Клиентский компонент для установки куки
export default function SetViewCookie({ id }: { id: string }) {
  useEffect(() => {
    const name = `viewed_effect_${id}`;
    if (!document.cookie.includes(name)) {
      document.cookie = `${name}=true; path=/; max-age=86400`; // 24 часа
    }
  }, [id]);

  return null;
}

