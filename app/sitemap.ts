import { MetadataRoute } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://yourdomain.com';
  
  // Загружаем эффекты для sitemap
  let effects: any[] = [];
  try {
    const filePath = join(process.cwd(), 'data', 'effects.json');
    const fileContents = readFileSync(filePath, 'utf8');
    effects = JSON.parse(fileContents);
  } catch (error) {
    console.error('Ошибка загрузки эффектов для sitemap:', error);
  }

  const effectUrls = effects.map((effect) => ({
    url: `${baseUrl}/effect/${effect.id}`,
    lastModified: new Date(effect.dateAdded),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/my-memory`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/quiz`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...effectUrls,
  ];
}

