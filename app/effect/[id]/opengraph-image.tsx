import { ImageResponse } from 'next/og';
import prisma from '@/lib/prisma';
import sharp from 'sharp';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';
export const runtime = 'nodejs';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Загружаем шрифт (Inter Black)
    const fontData = await fetch(
      'https://unpkg.com/@fontsource/inter@5.0.8/files/inter-latin-900-normal.woff',
      { cache: 'force-cache' }
    ).then(async (res) => {
      if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
      return res.arrayBuffer();
    });

    console.log(`[OG] Generating image for effect: ${id}`);

    // 2. Получаем данные
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
      return new ImageResponse(
        (
          <div style={{ background: '#111', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 48 }}>
            Эффект не найден
          </div>
        ),
        { ...size }
      );
    }

    // 3. Обработка картинки (WebP -> PNG)
    let bgImageSrc: string | null = null;
    
    if (effect.imageUrl) {
      try {
        console.log('[OG] Fetching and converting image...');
        const imageRes = await fetch(effect.imageUrl);
        if (imageRes.ok) {
          const imageBuffer = await imageRes.arrayBuffer();

          const pngBuffer = await sharp(Buffer.from(imageBuffer))
            .toFormat('png')
            .resize(1200, 630, { fit: 'cover' })
            .toBuffer();
          
          bgImageSrc = `data:image/png;base64,${pngBuffer.toString('base64')}`;
        }
      } catch (imgError) {
        console.error('[OG] Failed to process image:', imgError);
      }
    }

    // 4. Считаем проценты
    const total = effect.votesFor + effect.votesAgainst;
    const percentA = total === 0 ? 50 : Math.round((effect.votesFor / total) * 100);
    const percentB = total === 0 ? 50 : Math.round((effect.votesAgainst / total) * 100);

    // 5. Генерируем картинку
    return new ImageResponse(
      (
        <div
          style={{
            background: '#050505',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            fontFamily: '"Inter"',
          }}
        >
          {/* ФОНОВАЯ КАРТИНКА */}
          {bgImageSrc && (
            <img
              src={bgImageSrc}
              alt="bg"
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.6,
              }}
            />
          )}

          {/* ГРАДИЕНТ */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, #050505 0%, rgba(5,5,5,0.95) 45%, rgba(5,5,5,0) 100%)',
            }}
          />

          {/* КОНТЕНТ */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%',
              width: '60%',
              paddingLeft: 60,
              paddingRight: 20,
            }}
          >
            {/* Бейдж (FIXED: alignSelf вместо width: fit-content) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                alignSelf: 'flex-start', // <-- ВАЖНОЕ ИСПРАВЛЕНИЕ
                background: 'rgba(234, 179, 8, 0.1)',
                border: '2px solid rgba(234, 179, 8, 0.4)',
                borderRadius: 50,
                padding: '10px 24px',
                marginBottom: 30,
              }}
            >
              <span style={{ color: '#FACC15', fontSize: 20, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                ЭФФЕКТ МАНДЕЛЫ
              </span>
            </div>

            {/* Заголовок */}
            <div style={{ fontSize: 72, fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: 20, textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}>
              {effect.title.length > 40 ? effect.title.slice(0, 40) + '...' : effect.title}
            </div>

            {/* Описание */}
            <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.7)', marginBottom: 60, lineHeight: 1.4, maxHeight: 130, overflow: 'hidden' }}>
              {effect.description.length > 80 ? effect.description.slice(0, 80) + '...' : effect.description}
            </div>

            {/* Голосование */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
              
              {/* Вариант А */}
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(69, 10, 10, 0.8)', border: '3px solid #EF4444', borderRadius: 20, padding: '0 25px', height: 80, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${percentA}%`, background: '#991B1B' }} />
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ color: 'white', fontSize: 28, fontWeight: 900 }}>Как я помню</span>
                  <span style={{ color: 'white', fontSize: 40, fontWeight: 900 }}>{percentA}%</span>
                </div>
              </div>

              {/* Вариант Б */}
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(8, 51, 68, 0.8)', border: '3px solid #06B6D4', borderRadius: 20, padding: '0 25px', height: 80, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${percentB}%`, background: '#155E75' }} />
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 28, fontWeight: 900 }}>Как в реальности</span>
                  <span style={{ color: '#22D3EE', fontSize: 40, fontWeight: 900 }}>{percentB}%</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: 'Inter',
            data: fontData,
            style: 'normal',
            weight: 900,
          },
        ],
      }
    );
  } catch (e) {
    console.error('[OG] Error generating image:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
