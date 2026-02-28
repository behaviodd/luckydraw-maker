'use client';

import { use, useCallback } from 'react';
import { useLuckyDraw } from '@/hooks/useLuckyDraws';
import { DrawScreen } from '@/components/domain/DrawScreen';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { draw, setDraw, loading } = useLuckyDraw(id);

  const handleItemDecremented = useCallback((itemId: string, newRemaining: number) => {
    setDraw((prev) => {
      if (!prev?.items) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, remaining: newRemaining } : item
        ),
      };
    });
  }, [setDraw]);

  if (loading || !draw) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <DrawScreen draw={draw} onItemDecremented={handleItemDecremented} />;
}
