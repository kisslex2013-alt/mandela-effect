'use client';

import Script from 'next/script';

interface StructuredDataProps {
  data: Record<string, any>;
}

/**
 * Компонент для добавления JSON-LD структурированных данных
 * Используется для SEO и rich snippets в поисковой выдаче
 */
export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}

