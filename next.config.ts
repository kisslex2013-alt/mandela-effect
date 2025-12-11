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
    // Временно отключаем PPR и React Compiler, так как они вызывают ошибки версий
    // ppr: 'incremental', 
    // reactCompiler: true,
    
    serverActions: {
      bodySizeLimit: '10mb', // Увеличено для загрузки изображений до 10MB
      // Увеличиваем таймаут для AI генерации
      allowedOrigins: ['localhost:3000'],
    },
    // Оптимизация компиляции в dev режиме + Tree-shaking для тяжелых библиотек
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },

  // Очистка кэша для проблемных модулей
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Очищаем кэш для удаленных файлов
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/lazy-charts': false, // Блокируем импорт удаленного файла
      };
    }
    return config;
  },

  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'], // AVIF приоритетнее (лучше сжатие)
    minimumCacheTTL: 31536000, // Кэш на 1 год
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      // Cloudinary
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // AI генерация изображений
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
      },
      // Ресайз изображений
      {
        protocol: 'https',
        hostname: 'wsrv.nl',
      },
      // Превью видео YouTube
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      // Supabase Storage (все поддомены)
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      // Аватарки Google
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Vercel Blob Storage (fallback)
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
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
