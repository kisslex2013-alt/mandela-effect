import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import AdminClient from './AdminClient';
import LoginForm from './LoginForm';

export default async function AdminPage() {
  // Проверяем наличие cookie admin_session
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  const isAuthenticated = session?.value === 'authenticated';

  // Если не авторизован — показываем форму входа
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Загружаем все эффекты из базы данных
  const effects = await prisma.effect.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      category: true,
      imageUrl: true,
      videoUrl: true,
      votesFor: true,
      votesAgainst: true,
      views: true,
      residue: true,
      residueSource: true,
      history: true,
      historySource: true,
      yearDiscovered: true,
      interpretations: true,
      isVisible: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Загружаем заявки (только PENDING для модерации)
  const submissions = await prisma.submission.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  // Загружаем категории из БД
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  // Преобразуем данные для клиента
  const effectsData = effects.map((effect) => ({
    id: effect.id,
    title: effect.title,
    description: effect.description,
    content: effect.content,
    category: effect.category,
    imageUrl: effect.imageUrl,
    videoUrl: effect.videoUrl,
    votesFor: effect.votesFor,
    votesAgainst: effect.votesAgainst,
    views: effect.views,
    residue: effect.residue,
    residueSource: effect.residueSource,
    history: effect.history,
    historySource: effect.historySource,
    yearDiscovered: effect.yearDiscovered,
    interpretations: effect.interpretations as Record<string, string> | null,
    isVisible: effect.isVisible,
    createdAt: effect.createdAt.toISOString(),
    updatedAt: effect.updatedAt.toISOString(),
  }));

  const submissionsData = submissions.map((sub) => ({
    id: sub.id,
    category: sub.category,
    title: sub.title,
    question: sub.question,
    variantA: sub.variantA,
    variantB: sub.variantB,
    currentState: sub.currentState,
    sourceLink: sub.sourceLink,
    submitterEmail: sub.submitterEmail,
    interpretations: sub.interpretations as Record<string, string> | null,
    status: sub.status,
    createdAt: sub.createdAt.toISOString(),
  }));

  const categoriesData = categories.map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    emoji: cat.emoji,
    color: cat.color,
    sortOrder: cat.sortOrder,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  }));

  return <AdminClient effects={effectsData} submissions={submissionsData} categories={categoriesData} />;
}
