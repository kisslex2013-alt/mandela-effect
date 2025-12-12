import type { NextConfig } from "next";

// Bundle analyzer (опционально, запускается через ANALYZE=true npm run build)
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({
      enabled: true,
    })
  : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  // Настройки Server Actions для стабильности
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['localhost:3000'],
    },
    // Tree-shaking для тяжелых библиотек - КРИТИЧНО для bundle size
    optimizePackageImports: [
      'lucide-react', 
      'framer-motion', 
      'recharts',
      'date-fns',
      '@vercel/analytics',
    ],
  },

  // Webpack оптимизации
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/lazy-charts': false,
      };
    }
    
    // Production оптимизации
    if (!dev) {
      // Минификация
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
      };
    }
    
    return config;
  },

  // ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЙ - КРИТИЧНО для LCP
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 год
    // Оптимизированные размеры для реальных устройств
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Включаем оптимизацию для ВСЕХ доменов через remotePatterns
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: 'wsrv.nl' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      // Добавляем все возможные источники изображений
      { protocol: 'https', hostname: '**' }, // Разрешаем все HTTPS домены для оптимизации
    ],
    // Отключаем unoptimized по умолчанию для лучшего LCP
    unoptimized: false,
  },

  // Агрессивное кэширование статики
  async headers() {
    return [
      // Изображения - 1 год
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|gif)',
        locale: false,
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Next.js static assets - 1 год
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Шрифты - 1 год
      {
        source: '/:all*(woff|woff2|ttf|otf)',
        locale: false,
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Data routes (ISR) - stale-while-revalidate
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },

  // Компрессия
  compress: true,

  // React Strict Mode для выявления проблем
  reactStrictMode: true,

  // Отключение source maps в production
  productionBrowserSourceMaps: false,

  // Включаем powered by header для кэширования
  poweredByHeader: false,
};

export default withBundleAnalyzer(nextConfig);
