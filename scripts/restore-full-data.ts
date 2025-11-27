import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Интерфейс для данных из JSON
interface EffectJson {
  id: number;
  category: string;
  categoryEmoji?: string;
  categoryName?: string;
  title: string;
  question: string;
  variantA: string;
  variantB: string;
  votesA: number;
  votesB: number;
  currentState?: string;
  sourceLink?: string;
  dateAdded?: string;
  interpretations?: {
    scientific?: string;
    scientificTheory?: string;
    scientificSource?: string;
    community?: string;
    communitySource?: string;
  };
}

async function restoreFullData() {
  console.log('🔄 Восстановление данных из restore.json...\n');

  try {
    // 1. Читаем файл restore.json
    const filePath = path.join(process.cwd(), 'restore.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ Файл restore.json не найден в корне проекта!');
      process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const effectsJson: EffectJson[] = JSON.parse(fileContent);

    console.log(`📖 Прочитано ${effectsJson.length} эффектов из restore.json\n`);

    let updatedCount = 0;
    let notFoundCount = 0;
    let skippedCount = 0;

    // 3. Проходим по каждому элементу
    for (const effectData of effectsJson) {
      try {
        // 4. Ищем эффект в базе по title
        const existingEffect = await prisma.effect.findFirst({
          where: { title: effectData.title },
        });

        if (!existingEffect) {
          console.log(`⚠️  Не найден: "${effectData.title}"`);
          notFoundCount++;
          continue;
        }

        // Проверяем, есть ли данные для обновления
        if (!effectData.interpretations && !effectData.currentState && !effectData.sourceLink) {
          console.log(`⏭️  Пропущен (нет данных): "${effectData.title}"`);
          skippedCount++;
          continue;
        }

        // 5. Обновляем поля
        const updateData: {
          interpretations?: object;
          residue?: string;
          history?: string;
        } = {};

        // Обновляем interpretations если есть
        if (effectData.interpretations) {
          updateData.interpretations = effectData.interpretations;
        }

        // Обновляем currentState -> residue (в нашей схеме это поле residue)
        if (effectData.currentState) {
          updateData.residue = effectData.currentState;
        }

        // Обновляем sourceLink -> history (в нашей схеме это поле history)
        if (effectData.sourceLink) {
          updateData.history = effectData.sourceLink;
        }

        await prisma.effect.update({
          where: { id: existingEffect.id },
          data: updateData,
        });

        updatedCount++;
        console.log(`✅ Обновлён: "${effectData.title}"`);

        // Показываем что обновили
        const updates: string[] = [];
        if (effectData.interpretations) updates.push('interpretations');
        if (effectData.currentState) updates.push('currentState→residue');
        if (effectData.sourceLink) updates.push('sourceLink→history');
        console.log(`   └─ Поля: ${updates.join(', ')}`);

      } catch (error) {
        console.error(`❌ Ошибка при обновлении "${effectData.title}":`, error);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Восстановление завершено!`);
    console.log(`   ✅ Обновлено: ${updatedCount} эффектов`);
    console.log(`   ⚠️  Не найдено: ${notFoundCount} эффектов`);
    console.log(`   ⏭️  Пропущено: ${skippedCount} эффектов`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreFullData();

