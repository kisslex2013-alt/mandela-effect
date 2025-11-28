import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mandela-effect.vercel.app';
  
  // Получаем все эффекты из базы данных с обработкой ошибок
  let effects: { id: string; updatedAt: Date }[] = [];
  
  try {
    effects = await prisma.effect.findMany({
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('[sitemap] Ошибка при получении эффектов:', error);
    // В случае ошибки возвращаем только статические страницы
    // Это лучше, чем падение всего билда
  }
  
  // Статические страницы
  const staticPages: MetadataRoute.Sitemap = [
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
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/my-memory`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/quiz`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
  
  // Страницы эффектов
  const effectPages: MetadataRoute.Sitemap = effects.map((effect) => ({
    url: `${baseUrl}/effect/${effect.id}`,
    lastModified: effect.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
  
  return [...staticPages, ...effectPages];
}
