'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/themeStore';
import { useIsAdmin } from '@/contexts/AdminContext';

type GlowColor = 'rose' | 'lavender' | 'sky';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'ref' | 'children'> {
  glow?: GlowColor;
  title?: string;
  children?: React.ReactNode;
}

const glowStyles: Record<GlowColor, string> = {
  rose: 'shadow-brutal-pink border-gum-pink',
  lavender: 'shadow-[4px_4px_0px_var(--color-gum-purple)] border-gum-purple',
  sky: 'shadow-[4px_4px_0px_var(--color-gum-blue)] border-gum-blue',
};

const cottonGlowStyles: Record<GlowColor, string> = {
  rose: 'shadow-[0_0_24px_rgba(255,111,168,0.35)] border-[rgba(255,111,168,0.4)]',
  lavender: 'shadow-[0_0_20px_rgba(201,168,226,0.3)] border-[rgba(201,168,226,0.4)]',
  sky: 'shadow-[0_0_20px_rgba(255,221,225,0.3)] border-[rgba(255,221,225,0.5)]',
};

export function GlassCard({ glow, title, className, children, ...props }: GlassCardProps) {
  const isAdmin = useIsAdmin();
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const isRetro = !isAdmin && currentTheme === 'retro-pc';
  const isCottonCandy = !isAdmin && currentTheme === 'cotton-candy';

  const activeGlowStyles = isCottonCandy ? cottonGlowStyles : glowStyles;

  return (
    <motion.div
      className={cn(
        'brutal-card p-6',
        glow && activeGlowStyles[glow],
        className
      )}
      {...props}
    >
      {isRetro && title && (
        <div className="retro-titlebar -mx-6 -mt-6 mb-4 px-2 py-1">
          <span>■ {title}</span>
          <span>[×]</span>
        </div>
      )}
      {children}
    </motion.div>
  );
}
