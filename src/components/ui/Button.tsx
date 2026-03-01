'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useIsAdmin } from '@/contexts/AdminContext';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'draw';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-gum-pink text-white px-6 py-3',
    'border-3 border-gum-black shadow-brutal',
    'hover:shadow-brutal-lg hover:translate-x-[-2px] hover:translate-y-[-2px]',
    'active:shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px]',
  ].join(' '),
  secondary: [
    'bg-bg-card text-gum-black px-6 py-3',
    'border-3 border-gum-black shadow-brutal',
    'hover:bg-gum-cream hover:shadow-brutal-lg hover:translate-x-[-2px] hover:translate-y-[-2px]',
  ].join(' '),
  ghost: [
    'bg-transparent text-text-secondary px-4 py-2',
    'hover:text-gum-black hover:bg-bg-subtle',
  ].join(' '),
  danger: [
    'bg-gum-coral text-white px-6 py-3',
    'border-3 border-gum-black shadow-brutal',
    'hover:shadow-brutal-lg hover:translate-x-[-2px] hover:translate-y-[-2px]',
  ].join(' '),
  draw: [
    'min-w-[280px] h-[80px] text-xl font-display',
    'bg-gum-pink text-white',
    'border-4 border-gum-black shadow-brutal-lg',
    'hover:bg-gum-yellow hover:text-gum-black hover:shadow-[8px_8px_0px_var(--color-gum-black)] hover:translate-x-[-3px] hover:translate-y-[-3px]',
    'active:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px]',
    'animate-wiggle',
  ].join(' '),
};

const candyVariantStyles: Partial<Record<ButtonVariant, string>> = {
  draw: [
    'min-w-[280px] h-[80px] text-xl font-display',
    'text-white border-0',
    'btn-draw',
  ].join(' '),
  primary: [
    'text-white px-6 py-3',
    'border-0',
    'hover:brightness-110',
  ].join(' '),
  secondary: [
    'bg-accent-secondary text-white px-6 py-3',
    'border-0',
    'hover:bg-accent-primary',
    'transition-colors duration-300',
  ].join(' '),
  danger: [
    'bg-error text-white px-6 py-3',
    'border-0',
  ].join(' '),
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading, className, children, disabled, style, ...props }, ref) => {
    const isAdmin = useIsAdmin();
    const currentTheme = useThemeStore((s) => s.currentTheme);
    const isRetro = !isAdmin && currentTheme === 'retro-pc';
    const isCottonCandy = !isAdmin && currentTheme === 'cotton-candy';

    const baseClasses = 'inline-flex items-center justify-center gap-2 font-display text-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    let variantClasses: string;
    let extraStyle = style;

    if (isRetro && variant !== 'ghost') {
      variantClasses = cn('retro-button px-6 py-3 font-display text-lg', variant === 'draw' && 'btn-draw min-w-[280px] h-[80px] text-xl');
    } else if (isCottonCandy && variant !== 'ghost') {
      variantClasses = cn(
        candyVariantStyles[variant] ?? variantStyles[variant],
        'rounded-[var(--radius-button,50px)]',
      );
      if (variant === 'draw' || variant === 'primary') {
        extraStyle = {
          ...style,
          background: '#FF99C0',
        };
      }
    } else {
      variantClasses = variantStyles[variant];
    }

    return (
      <motion.button
        ref={ref}
        whileHover={disabled || isRetro ? {} : { scale: 1.02 }}
        whileTap={disabled || isRetro ? {} : { scale: 0.98 }}
        className={cn(baseClasses, variantClasses, className)}
        style={extraStyle}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-5 h-5 border-3 border-white border-t-transparent animate-spin" />
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
