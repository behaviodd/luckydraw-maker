import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PlayClient from './PlayClient';

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { id } = await params;

  // 최소 필드만 조회 — userId, items, probability_mode 등 미포함
  const { data: draw } = await supabase
    .from('lucky_draws')
    .select('id, name, draw_button_label')
    .eq('id', id)
    .single();

  if (!draw) redirect('/');

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
