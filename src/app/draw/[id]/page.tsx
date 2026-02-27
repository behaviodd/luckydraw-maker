'use client';

import { use } from 'react';
import { useLuckyDraw } from '@/hooks/useLuckyDraws';
import { DrawScreen } from '@/components/domain/DrawScreen';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { draw, loading } = useLuckyDraw(id);

  if (loading || !draw) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <DrawScreen draw={draw} />;
}
