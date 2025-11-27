import prisma from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

// Интерфейс для данных из JSON
interface SubmissionJson {
  id: number;
  category: string;
  categoryEmoji?: string;
  categoryName?: string;
  title: string;
  question: string;
  variantA: string;
  variantB: string;
  currentState?: string;
  sourceLink?: string;
  submitterEmail?: string;
  status?: string;
  dateSubmitted?: string;
  votesA?: number;
  votesB?: number;
  interpretations?: {
    scientific?: string;
    scientificTheory?: string;
    scientificSource?: string;
    community?: string;
    communitySource?: string;
  };
}

async function main() {
  console.log('🌱 Начинаю сидирование заявок (submissions)...\n');

  // Читаем файл submissions.json
  const filePath = path.join(process.cwd(), 'data', 'submissions.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const submissionsJson: SubmissionJson[] = JSON.parse(fileContent);

  console.log(`📖 Прочитано ${submissionsJson.length} заявок из submissions.json\n`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const submission of submissionsJson) {
    try {
      // Создаём заявку в базе (id генерируется автоматически)
      await prisma.submission.create({
        data: {
          category: submission.category,
          title: submission.title,
          question: submission.question,
          variantA: submission.variantA,
          variantB: submission.variantB,
          currentState: submission.currentState || undefined,
          sourceLink: submission.sourceLink || undefined,
          submitterEmail: submission.submitterEmail || undefined,
          interpretations: submission.interpretations ? submission.interpretations : undefined,
          status: submission.status?.toUpperCase() || 'PENDING',
        },
      });

      createdCount++;
      console.log(`✅ Создана заявка: "${submission.title}"`);
    } catch (error) {
      skippedCount++;
      console.error(`❌ Ошибка при создании заявки "${submission.title}":`, error);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`🎉 Сидирование заявок завершено!`);
  console.log(`   ✅ Добавлено: ${createdCount} заявок`);
  console.log(`   ❌ Пропущено: ${skippedCount} заявок`);
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error('💥 Критическая ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

