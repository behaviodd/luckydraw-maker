import { createServerClient } from '@/lib/supabase/server';
import PlayClient from './PlayClient';

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  const { id } = await params;

  // 최소 필드만 조회 — userId, items, probability_mode 등 미포함
  // RLS: anon은 is_active=true인 드로우만 조회 가능
  const { data: draw } = await supabase
    .from('lucky_draws')
    .select('id, name, draw_button_label, is_active')
    .eq('id', id)
    .single();

  // 드로우가 존재하지 않음 (삭제됨 또는 잘못된 URL)
  if (!draw) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-4xl">🔍</p>
          <p className="text-xl font-display text-text-primary">존재하지 않는 이벤트입니다.</p>
          <p className="text-sm text-text-secondary">링크를 다시 확인해주세요.</p>
        </div>
      </div>
    );
  }

  // 드로우가 비활성 상태 (운영자가 종료함)
  if (!draw.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-4xl">🎪</p>
          <p className="text-xl font-display text-text-primary">종료된 이벤트입니다.</p>
          <p className="text-sm text-text-secondary">이 럭키드로우는 더 이상 진행되지 않습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <PlayClient
      drawData={{
        id: draw.id,
        name: draw.name,
        drawButtonLabel: draw.draw_button_label,
      }}
    />
  );
}
