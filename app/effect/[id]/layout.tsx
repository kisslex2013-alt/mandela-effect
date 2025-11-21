import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';

async function getEffectById(id: number) {
  try {
    const filePath = join(process.cwd(), 'data', 'effects.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const effectsData = JSON.parse(fileContents);
    return effectsData.find((effect: any) => effect.id === id);
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const effect = await getEffectById(parseInt(id));

  if (!effect) {
    return {
      title: 'Эффект не найден - Эффект Манделы',
      description: 'Эффект Манделы не найден',
    };
  }

  return {
    title: `${effect.title} - Эффект Манделы`,
    description: effect.question,
    keywords: `эффект манделы, ${effect.title}, ${effect.categoryName}`,
    alternates: {
      canonical: `https://yourdomain.com/effect/${effect.id}`,
    },
    openGraph: {
      title: `${effect.title} - Эффект Манделы`,
      description: effect.question,
      type: 'website',
      url: `https://yourdomain.com/effect/${effect.id}`,
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

