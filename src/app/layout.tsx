export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { StarField } from '@/components/ui/StarField';
import { ToastContainer } from '@/components/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: '럭드메이커 | Luckydraw Maker',
  description: '아이돌 이벤트 카페를 위한 감성 럭키드로우',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Chiron+GoRound+TC&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg-main font-body text-text-primary antialiased">
        <StarField />
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
