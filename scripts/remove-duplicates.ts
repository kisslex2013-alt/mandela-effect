import prisma from '../lib/prisma';

async function removeDuplicates() {
  console.log('🔍 Поиск дубликатов эффектов...\n');

  try {
    // Получаем все эффекты
    const allEffects = await prisma.effect.findMany({
      orderBy: { createdAt: 'asc' }, // Сортируем по дате создания, чтобы оставить самый старый
    });

    console.log(`📊 Всего эффектов в базе: ${allEffects.length}\n`);

    // Группируем по названию
    const groupedByTitle = new Map<string, typeof allEffects>();

    for (const effect of allEffects) {
      const existing = groupedByTitle.get(effect.title);
      if (existing) {
        existing.push(effect);
      } else {
        groupedByTitle.set(effect.title, [effect]);
      }
    }

    // Находим дубликаты
    const duplicatesToDelete: string[] = [];

    for (const [title, effects] of groupedByTitle) {
      if (effects.length > 1) {
        console.log(`🔄 Найден дубликат: "${title}" (${effects.length} копий)`);
        
        // Оставляем первый (самый старый), остальные помечаем на удаление
        const [keep, ...remove] = effects;
        console.log(`   ✅ Оставляем: ID ${keep.id} (создан ${keep.createdAt.toISOString()})`);
        
        for (const dup of remove) {
          console.log(`   ❌ Удаляем: ID ${dup.id} (создан ${dup.createdAt.toISOString()})`);
          duplicatesToDelete.push(dup.id);
        }
        console.log('');
      }
    }

    if (duplicatesToDelete.length === 0) {
      console.log('✨ Дубликатов не найдено!\n');
      return;
    }

    console.log(`\n🗑️ Удаление ${duplicatesToDelete.length} дубликатов...\n`);

    // Удаляем дубликаты
    const deleteResult = await prisma.effect.deleteMany({
      where: {
        id: { in: duplicatesToDelete },
      },
    });

    console.log('='.repeat(50));
    console.log(`🎉 Удалено дубликатов: ${deleteResult.count}`);
    console.log(`📊 Осталось эффектов: ${allEffects.length - deleteResult.count}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('💥 Ошибка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicates();

