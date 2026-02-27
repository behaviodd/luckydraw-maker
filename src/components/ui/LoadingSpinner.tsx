import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'gap-1', md: 'gap-1.5', lg: 'gap-2' };
const dotSizes = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' };
const COLORS = ['bg-gum-pink', 'bg-gum-yellow', 'bg-gum-green', 'bg-gum-blue'];

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', sizes[size], className)}>
      {COLORS.map((color, i) => (
        <div
          key={i}
          className={cn(dotSizes[size], color, 'border-2 border-gum-black animate-bounce')}
          style={{ animationDelay: `${i * 0.12}s`, animationDuration: '0.6s' }}
        />
      ))}
    </div>
  );
}
