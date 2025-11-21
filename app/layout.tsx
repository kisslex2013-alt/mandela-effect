import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Эффект Манделы - Исследуй различия в восприятии",
  description: "Все помнят по-разному. Исследуй эффект Манделы - феномен ложных воспоминаний. Нет правильных ответов - есть разные восприятия.",
  keywords: "эффект манделы, ложные воспоминания, память, восприятие, коллективная память",
  alternates: {
    canonical: "https://yourdomain.com",
  },
  openGraph: {
    title: "Эффект Манделы",
    description: "Исследуй различия в восприятии и памяти",
    type: "website",
    url: "https://yourdomain.com",
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
    <html lang="ru">
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
      >
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
      </body>
    </html>
  );
}
