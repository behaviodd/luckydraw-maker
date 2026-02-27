'use client';

import { use } from 'react';
import { useLuckyDraw } from '@/hooks/useLuckyDraws';
import { LuckyDrawEditor } from '@/components/domain/LuckyDrawEditor';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { draw, loading } = useLuckyDraw(id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <LuckyDrawEditor existingDraw={draw} />;
}
