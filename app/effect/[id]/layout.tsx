import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import StructuredData from '@/components/seo/StructuredData';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  
  const effect = await prisma.effect.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      imageUrl: true,
      votesFor: true,
      votesAgainst: true,
      createdAt: true,
      updatedAt: true,
      category: true,
    }
  });

  if (!effect) {
    return {
      title: 'Эффект не найден - Эффект Манделы',
    };
  }

  // Next.js автоматически подхватывает opengraph-image.tsx
  // Используем абсолютный URL для OG-изображения
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const ogImageUrl = `${baseUrl}/effect/${id}/opengraph-image`;

  return {
    title: `${effect.title} - Эффект Манделы`,
    description: effect.description || 'Исследуй коллективные заблуждения и проверь свою реальность',
    alternates: {
      canonical: `${baseUrl}/effect/${id}`,
    },
    openGraph: {
      title: effect.title,
      description: effect.description || 'Исследуй коллективные заблуждения и проверь свою реальность',
      url: `${baseUrl}/effect/${id}`,
      siteName: 'mandela-effect.ru',
      locale: 'ru_RU',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: effect.title,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: effect.title,
      description: effect.description || 'Исследуй коллективные заблуждения и проверь свою реальность',
      images: [ogImageUrl],
    },
  };
}

export default async function EffectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mandela-effect.ru';
  
  // Получаем данные эффекта для JSON-LD
  const effect = await prisma.effect.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
      category: true,
      votesFor: true,
      votesAgainst: true,
    }
  });

  // JSON-LD для Article (если эффект найден)
  const articleStructuredData = effect ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: effect.title,
    description: effect.description || 'Исследуй коллективные заблуждения и проверь свою реальность',
    image: effect.imageUrl ? [effect.imageUrl] : [],
    datePublished: effect.createdAt.toISOString(),
    dateModified: effect.updatedAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Mandela Effect Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Эффект Манделы',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/effect/${id}`,
    },
    // Добавляем агрегированный рейтинг для rich snippets (только если есть голоса)
    ...(effect.votesFor + effect.votesAgainst > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: effect.votesFor > effect.votesAgainst ? '4' : '3',
        bestRating: '5',
        worstRating: '1',
        ratingCount: effect.votesFor + effect.votesAgainst,
      },
    }),
    // Категория как articleSection
    articleSection: effect.category,
  } : null;

  return (
    <>
      {articleStructuredData && (
        <StructuredData data={articleStructuredData} />
      )}
      {children}
    </>
  );
}

