'use client';

import { useLuckyDraw } from '@/hooks/useLuckyDraws';
import { LuckyDrawEditor } from '@/components/domain/LuckyDrawEditor';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function EditClient({ id }: { id: string }) {
  const { draw, loading } = useLuckyDraw(id, true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <LuckyDrawEditor existingDraw={draw} />;
}
