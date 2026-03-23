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

export function GlassCard({ glow, title, className, children, ...props }: GlassCardProps) {
  const isAdmin = useIsAdmin();
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const isRetro = !isAdmin && currentTheme === 'retro-pc';

  return (
    <motion.div
      className={cn(
        'brutal-card p-6',
        glow && glowStyles[glow],
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
