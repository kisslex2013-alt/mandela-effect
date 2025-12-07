import { ImageResponse } from 'next/og';
import prisma from '@/lib/prisma';
import sharp from 'sharp';

// Оставляем мета-теги 1200x630 для совместимости, но реальную картинку отдадим меньше
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/jpeg'; // Меняем на JPEG явно
export const runtime = 'nodejs';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Загружаем шрифт
    const fontData = await fetch(
      'https://unpkg.com/@fontsource/inter@5.0.8/files/inter-latin-900-normal.woff',
      { cache: 'force-cache' }
    ).then((res) => {
      if (!res.ok) throw new Error('Font failed');
      return res.arrayBuffer();
    });

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
        <div style={{ background: '#000', color: '#fff', fontSize: 48 }}>404</div>,
        { ...size }
      );
    }

    // 3. Обработка фоновой картинки
    let bgImageSrc: string | null = null;
    if (effect.imageUrl) {
      try {
        const imageRes = await fetch(effect.imageUrl);
        if (imageRes.ok) {
          const imageBuffer = await imageRes.arrayBuffer();
          // Ресайзим исходник сразу, чтобы не грузить память
          const resizedBuffer = await sharp(Buffer.from(imageBuffer))
            .resize(600, 315, { fit: 'cover' }) // Маленький размер для фона
            .jpeg({ quality: 70 })
            .toBuffer();
          bgImageSrc = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
        }
      } catch (e) {
        console.error('Image fetch failed', e);
      }
    }

    const total = effect.votesFor + effect.votesAgainst;
    const percentA = total === 0 ? 50 : Math.round((effect.votesFor / total) * 100);
    const percentB = total === 0 ? 50 : Math.round((effect.votesAgainst / total) * 100);

    // 4. Генерируем макет (Satori)
    const imageResponse = new ImageResponse(
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

          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(90deg, #050505 0%, rgba(5,5,5,0.95) 45%, rgba(5,5,5,0) 100%)',
            }}
          />

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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(234, 179, 8, 0.1)',
                border: '2px solid rgba(234, 179, 8, 0.4)',
                borderRadius: 50,
                padding: '10px 24px',
                marginBottom: 30,
                alignSelf: 'flex-start',
              }}
            >
              <span style={{ color: '#FACC15', fontSize: 20, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                ЭФФЕКТ МАНДЕЛЫ
              </span>
            </div>

            <div style={{ fontSize: 72, fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: 20, textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}>
              {effect.title.length > 40 ? effect.title.slice(0, 40) + '...' : effect.title}
            </div>

            <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.7)', marginBottom: 60, lineHeight: 1.4, maxHeight: 130, overflow: 'hidden' }}>
              {effect.description.length > 80 ? effect.description.slice(0, 80) + '...' : effect.description}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(69, 10, 10, 0.8)', border: '3px solid #EF4444', borderRadius: 20, padding: '0 25px', height: 80, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${percentA}%`, background: '#991B1B' }} />
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ color: 'white', fontSize: 28, fontWeight: 900 }}>Как я помню</span>
                  <span style={{ color: 'white', fontSize: 40, fontWeight: 900 }}>{percentA}%</span>
                </div>
              </div>
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
      { ...size, fonts: [{ name: 'Inter', data: fontData, style: 'normal', weight: 900 }] }
    );

    // 5. ФИНАЛЬНОЕ СЖАТИЕ (Самое важное для WhatsApp)
    const buffer = await imageResponse.arrayBuffer();
    const compressedBuffer = await sharp(Buffer.from(buffer))
      .resize(600, 315, { fit: 'contain', background: '#050505' }) // Уменьшаем физический размер в 2 раза
      .jpeg({ 
        quality: 60, // Низкое качество (для превью достаточно)
        mozjpeg: true,
        chromaSubsampling: '4:2:0'
      })
      .toBuffer();

    return new Response(new Uint8Array(compressedBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (e) {
    console.error('[OG] Error:', e);
    return new Response('Error', { status: 500 });
  }
}
