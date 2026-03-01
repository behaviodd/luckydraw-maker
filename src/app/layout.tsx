export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { BackgroundEffect } from '@/components/ui/BackgroundEffect';
import { ToastContainer } from '@/components/ui/Toast';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: '럭키드로우메이커 | Luckydraw Maker',
  description: '아이돌 이벤트 카페를 위한 감성 럭키드로우',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="dark-glass" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Gothic+A1:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){try{var d=JSON.parse(localStorage.getItem('luckydraw-theme')||'{}');
          var t=d.state&&d.state.currentTheme;
          if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();
        `}} />
      </head>
      <body className="min-h-screen bg-bg-main font-body text-text-primary antialiased">
        <ThemeProvider>
          <BackgroundEffect />
          {children}
          <footer className="relative z-10 py-4 text-center text-xs text-text-muted font-mono">
            2026 bhvd
          </footer>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
