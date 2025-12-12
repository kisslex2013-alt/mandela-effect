import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { LazyMotion, domAnimation } from "framer-motion";
import { RealityProvider } from "@/lib/context/RealityContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ScrollToTop from "@/components/ScrollToTop";

// Client-only компоненты (lazy loaded)
import { 
  UpsideDownLayer, 
  RealityTransition, 
  SoundToggle, 
  DevTools 
} from "@/components/ClientOnlyComponents";

// ОПТИМИЗАЦИЯ ШРИФТОВ для FCP:
// 1. display: "swap" - показывает fallback сразу, потом меняет на загруженный
// 2. preload: true только для Inter (основной шрифт)
// 3. Ограниченные subsets для уменьшения размера
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
  adjustFontFallback: true,
});

// Моноширинный шрифт - НЕ preload, загружается по требованию
const mono = JetBrains_Mono({
  subsets: ["latin"], // Только latin для уменьшения размера
  variable: "--font-mono",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
  adjustFontFallback: true,
});

// Ruslan Display удален - не используется в проекте и вызывал таймауты при загрузке

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: "Эффект Манделы | Каталог ложных воспоминаний",
    template: "%s | Эффект Манделы",
  },
  description:
    "Интерактивный каталог коллективных ложных воспоминаний. Голосуй, обсуждай и исследуй сбои в матрице.",
  keywords: [
    "эффект манделы",
    "ложные воспоминания",
    "коллективная память",
    "параллельные вселенные",
    "матрица",
  ],
  authors: [{ name: "Mandela Effect Team" }],
  creator: "Mandela Effect Team",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://mandela-effect.vercel.app",
    siteName: "Эффект Манделы",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Эффект Манделы",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Эффект Манделы",
    description: "Каталог сбоев реальности",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mandela-effect.ru';
  
  // JSON-LD для WebSite с SearchAction
  const websiteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Эффект Манделы',
    url: baseUrl,
    description: 'Интерактивный каталог коллективных ложных воспоминаний. Голосуй, обсуждай и исследуй сбои в матрице.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/catalog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // JSON-LD для Organization
  const organizationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Эффект Манделы',
    url: baseUrl,
    description: 'Интерактивный каталог коллективных ложных воспоминаний',
    sameAs: [
      'https://github.com/kisslex2013-alt',
    ],
  };

  return (
    <html lang="ru" className={`${inter.variable} ${mono.variable} scroll-smooth`}>
      <head>
        {/* JSON-LD для WebSite с SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData),
          }}
        />
        {/* JSON-LD для Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
      </head>
      <body className="bg-dark text-light antialiased selection:bg-primary/30 selection:text-white overflow-x-hidden" suppressHydrationWarning>
        <RealityProvider>
          {/* ОПТИМИЗАЦИЯ: LazyMotion загружает анимации асинхронно */}
          <LazyMotion features={domAnimation}>
            <RealityTransition /> {/* Эффект перехода */}
            <UpsideDownLayer />
            <Header />
            <main className="min-h-screen relative z-10">
              {children}
            </main>
            <Footer />
            {process.env.NODE_ENV !== 'production' && <DevTools />}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "#1a1a1a",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.1)",
                },
              }}
            />
            <ScrollToTop />
            <SoundToggle />
            <Analytics />
            <SpeedInsights />
          </LazyMotion>
        </RealityProvider>
      </body>
    </html>
  );
}
