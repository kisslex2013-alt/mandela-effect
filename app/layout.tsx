import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LazyMotion, domAnimation } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import SoundToggle from "@/components/ui/SoundToggle";
import "./globals.css";

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
  preload: false,
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Эффект Манделы - Исследуй различия в восприятии",
  description: "Все помнят по-разному. Исследуй эффект Манделы - феномен ложных воспоминаний. Нет правильных ответов - есть разные восприятия.",
  keywords: ["эффект манделы", "ложные воспоминания", "память", "восприятие"],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://yourdomain.com", // Лучше заменить на реальный домен, если есть
    title: "Эффект Манделы - Исследуй различия в восприятии",
    description: "Все помнят по-разному. Исследуй эффект Манделы.",
    siteName: "Эффект Манделы",
  },
  twitter: {
    card: "summary_large_image",
    title: "Эффект Манделы",
    description: "Все помнят по-разному. Исследуй различия в восприятии.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Эффект Манделы',
    description: 'Исследование различий в восприятии и памяти',
    url: 'https://yourdomain.com',
  };

  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body
        className={`${inter.variable} bg-dark text-light antialiased`}
        suppressHydrationWarning={true} // Игнорируем ошибки от расширений браузера
      >
        <LazyMotion features={domAnimation}>
          {/* Skip to content link для screen readers */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded z-50 focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          >
            Перейти к содержимому
          </a>
          
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#2a2a2a',
                color: '#e0e0e0',
                border: '1px solid #3b82f6',
                borderRadius: '0.75rem',
              },
              success: {
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#e0e0e0',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#e0e0e0',
                },
              },
            }}
          />
          
          <Header />
          {children}
          <Footer />
          
          <ScrollToTop />
          <SoundToggle />
          <Analytics />
          <SpeedInsights />
        </LazyMotion>
      </body>
    </html>
  );
}
