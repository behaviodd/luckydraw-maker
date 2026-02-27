'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

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
    'hover:bg-gum-yellow hover:text-gum-black hover:shadow-[8px_8px_0px_#1C1C1C] hover:translate-x-[-3px] hover:translate-y-[-3px]',
    'active:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px]',
    'animate-wiggle',
  ].join(' '),
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading, className, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={disabled ? {} : { scale: 1.02 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-display text-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          className
        )}
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
