import type { NextConfig } from "next";

// Bundle analyzer (опционально, запускается через ANALYZE=true npm run build)
// Установи: npm install --save-dev @next/bundle-analyzer
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({
      enabled: true,
    })
  : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  // Настройки Server Actions для стабильности
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      // Увеличиваем таймаут для AI генерации
      allowedOrigins: ['localhost:3000'],
    },
  },

  // Оптимизация изображений
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Разрешает любые домены
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Supabase Storage
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com', // Vercel Blob Storage (fallback)
      },
    ],
  },

  // Кэширование статических ресурсов
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Компрессия
  compress: true,

  // Оптимизация React
  reactStrictMode: true,

  // Отключение source maps в production для уменьшения размера
  productionBrowserSourceMaps: false,
};

export default withBundleAnalyzer(nextConfig);
