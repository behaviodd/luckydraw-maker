import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'rose' | 'lavender' | 'sky';
  className?: string;
}

const variants = {
  default: 'bg-bg-subtle text-text-secondary border-gum-black',
  rose: 'bg-gum-pink/15 text-gum-pink border-gum-pink',
  lavender: 'bg-gum-purple/15 text-gum-purple border-gum-purple',
  sky: 'bg-gum-blue/15 text-gum-blue border-gum-black',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge inline-flex items-center px-3 py-1 text-xs font-bold font-body border-2 shadow-brutal-sm',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
