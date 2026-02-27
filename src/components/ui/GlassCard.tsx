'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type GlowColor = 'rose' | 'lavender' | 'sky';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  glow?: GlowColor;
}

const glowStyles: Record<GlowColor, string> = {
  rose: 'shadow-[4px_4px_0px_#eb6b34] border-gum-pink',
  lavender: 'shadow-[4px_4px_0px_#C9B1FF] border-gum-purple',
  sky: 'shadow-[4px_4px_0px_#90B8F8] border-gum-blue',
};

export function GlassCard({ glow, className, children, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'brutal-card p-6',
        glow && glowStyles[glow],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
