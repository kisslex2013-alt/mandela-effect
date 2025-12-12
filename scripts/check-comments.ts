/**
 * Скрипт для проверки комментариев в базе данных
 * Показывает все комментарии со ссылками (imageUrl, videoUrl, audioUrl)
 * 
 * Запуск: npm run db:check-comments
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function checkComments() {
  try {
    console.log('\n🔍 Проверка комментариев в базе данных...\n');

    // Получаем все комментарии
    const allComments = await prisma.comment.findMany({
      select: {
        id: true,
        type: true,
        text: true,
        imageUrl: true,
        videoUrl: true,
        audioUrl: true,
        theoryType: true,
        status: true,
        createdAt: true,
        effect: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Всего комментариев: ${allComments.length}\n`);

    // Группируем комментарии
    const withImage = allComments.filter(c => c.imageUrl);
    const withVideo = allComments.filter(c => c.videoUrl);
    const withAudio = allComments.filter(c => c.audioUrl);
    const withoutMedia = allComments.filter(c => !c.imageUrl && !c.videoUrl && !c.audioUrl);
    const pendingComments = allComments.filter(c => c.status === 'PENDING');

    console.log(`📷 С изображениями: ${withImage.length}`);
    console.log(`🎥 С видео: ${withVideo.length}`);
    console.log(`🎵 С аудио: ${withAudio.length}`);
    console.log(`❌ Без медиа: ${withoutMedia.length}`);
    console.log(`⏳ На модерации (PENDING): ${pendingComments.length}\n`);

    // Показываем комментарии на модерации
    if (pendingComments.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 КОММЕНТАРИИ НА МОДЕРАЦИИ (PENDING):\n');
      
      pendingComments.forEach((comment, index) => {
        console.log(`${index + 1}. [${comment.status}] ${comment.type} - "${comment.effect.title}"`);
        console.log(`   Текст: ${comment.text.substring(0, 50)}${comment.text.length > 50 ? '...' : ''}`);
        console.log(`   ID: ${comment.id}`);
        console.log(`   Создан: ${comment.createdAt.toLocaleString('ru-RU')}`);
        
        if (comment.imageUrl) {
          console.log(`   ✅ imageUrl: ${comment.imageUrl}`);
        } else {
          console.log(`   ❌ imageUrl: null`);
        }
        
        if (comment.videoUrl) {
          console.log(`   ✅ videoUrl: ${comment.videoUrl}`);
        } else {
          console.log(`   ❌ videoUrl: null`);
        }
        
        if (comment.audioUrl) {
          console.log(`   ✅ audioUrl: ${comment.audioUrl}`);
        } else {
          console.log(`   ❌ audioUrl: null`);
        }
        
        if (comment.theoryType) {
          console.log(`   📚 theoryType: ${comment.theoryType}`);
        }
        
        console.log('');
      });
    }

    // Показываем примеры комментариев со ссылками
    const commentsWithMedia = allComments.filter(c => c.imageUrl || c.videoUrl || c.audioUrl);
    if (commentsWithMedia.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔗 КОММЕНТАРИИ СО ССЫЛКАМИ:\n');
      
      commentsWithMedia.slice(0, 5).forEach((comment, index) => {
        console.log(`${index + 1}. [${comment.status}] ${comment.type} - "${comment.effect.title}"`);
        if (comment.imageUrl) console.log(`   📷 imageUrl: ${comment.imageUrl}`);
        if (comment.videoUrl) console.log(`   🎥 videoUrl: ${comment.videoUrl}`);
        if (comment.audioUrl) console.log(`   🎵 audioUrl: ${comment.audioUrl}`);
        console.log('');
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Проверка завершена!\n');

  } catch (error) {
    console.error('❌ Ошибка при проверке комментариев:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkComments();

