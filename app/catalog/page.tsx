import CatalogClient from './CatalogClient';

// Серверный компонент - просто рендерит клиентский компонент
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const initialCategory = params.category || null;

  return <CatalogClient initialCategory={initialCategory} />;
}
