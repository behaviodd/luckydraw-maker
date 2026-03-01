'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { useUIStore } from '@/stores/uiStore';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const ACCENT_COLORS = [
  'var(--color-gum-pink)', 'var(--color-gum-yellow)', 'var(--color-gum-green)',
  'var(--color-gum-blue)', 'var(--color-gum-purple)', 'var(--color-gum-orange)',
  'var(--color-gum-coral)',
];

function LandingContent() {
  const { signInWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      addToast({ type: 'error', message: '로그인 실패! 다시 시도해주세요.' });
    }
  }, [searchParams, addToast]);

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
      <div className="flex flex-col items-center text-center max-w-lg">

        {/* Floating emojis */}
        <div className="relative mb-4">
          <motion.span
            className="absolute -top-8 -left-10 text-3xl"
            animate={{ y: [0, -8, 0], rotate: [0, 15, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ⭐
          </motion.span>
          <motion.span
            className="absolute -top-6 -right-12 text-3xl"
            animate={{ y: [0, -6, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
          >
            🎪
          </motion.span>
          <motion.span
            className="absolute -bottom-6 -left-8 text-2xl"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          >
            🎀
          </motion.span>
          <motion.span
            className="absolute -bottom-4 -right-8 text-2xl"
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 0.9 }}
          >
            🎯
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-5xl text-gum-black leading-tight"
          >
            럭키드로우메이커
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-text-secondary font-medium tracking-wider uppercase mb-2"
        >
          Luckydraw Maker
        </motion.p>

        {/* Colorful divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex items-center gap-1 mb-10 mt-4"
        >
          {ACCENT_COLORS.map((color, i) => (
            <div key={i} className="w-6 h-2 border border-gum-black" style={{ backgroundColor: color }} />
          ))}
        </motion.div>

        {/* Description card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="brutal-card-pink px-8 py-5 mb-10"
        >
          <p className="text-text-secondary text-sm mb-1">
            이벤트 카페를 위한
          </p>
          <p className="text-gum-black font-display text-lg">
            🎰 럭키드로우 메이커 🎲
          </p>
        </motion.div>

        {/* Google Login */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
        >
          <Button variant="primary" onClick={signInWithGoogle} className="text-base px-8 py-4">
            <GoogleIcon />
            Google로 시작하기
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 text-xs text-text-muted"
        >
          무료로 시작하세요 🎉
        </motion.p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingContent />
    </Suspense>
  );
}
