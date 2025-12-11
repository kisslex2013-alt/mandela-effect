import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Ruslan_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { LazyMotion, domAnimation } from "framer-motion";
import { RealityProvider } from "@/lib/context/RealityContext";
import UpsideDownLayer from "@/components/ui/UpsideDownLayer";
import RealityTransition from "@/components/ui/RealityTransition"; // НОВЫЙ КОМПОНЕНТ
import DevTools from "@/components/debug/DevTools";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ScrollToTop from "@/components/ScrollToTop";
import SoundToggle from "@/components/ui/SoundToggle";

// Настройки шрифтов с обработкой ошибок и fallback
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"], // Fallback если не загрузится
  adjustFontFallback: true,
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
  preload: false, // Не блокируем сборку
  fallback: ["Courier New", "monospace"], // Fallback если не загрузится
  adjustFontFallback: true,
});

// Шрифт для Изнанки - опциональный, не блокирует сборку
const ruslan = Ruslan_Display({
  weight: "400",
  subsets: ["cyrillic", "latin"],
  variable: "--font-ruslan",
  display: "swap",
  preload: false, // Не блокируем сборку
  fallback: ["Impact", "Arial Black", "sans-serif"], // Fallback если не загрузится
  adjustFontFallback: true,
});

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
  return (
    <html lang="ru" className={`${inter.variable} ${mono.variable} ${ruslan.variable} scroll-smooth`}>
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
            <DevTools />
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
