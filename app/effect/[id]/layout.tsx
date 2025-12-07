import type { Metadata } from 'next';
import prisma from '@/lib/prisma';

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
          height: 675,
          alt: effect.title,
          type: 'image/png',
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

export default function EffectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

