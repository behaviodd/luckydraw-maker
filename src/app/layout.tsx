import type { Metadata } from 'next';
import { Bagel_Fat_One, Gothic_A1, DM_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { BackgroundEffect } from '@/components/ui/BackgroundEffect';
import { ToastContainer } from '@/components/ui/Toast';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

const bagelFatOne = Bagel_Fat_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--nf-display',
  display: 'swap',
});

const gothicA1 = Gothic_A1({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--nf-body',
  display: 'swap',
});

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--nf-mono',
  display: 'swap',
});

const dungGeunMo = localFont({
  src: [
    { path: '../../public/fonts/DungGeunMo.woff2', style: 'normal' },
    { path: '../../public/fonts/DungGeunMo.woff', style: 'normal' },
  ],
  variable: '--nf-retro',
  display: 'swap',
});

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
    <html lang="ko" data-theme="dark-glass" suppressHydrationWarning
      className={`${bagelFatOne.variable} ${gothicA1.variable} ${dmMono.variable} ${dungGeunMo.variable}`}>

      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){try{var d=JSON.parse(localStorage.getItem('luckydraw-theme')||'{}');
          var t=d.state&&d.state.currentTheme;
          var v=['dark-glass','retro-pc'];
          if(t&&v.indexOf(t)!==-1)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();
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
