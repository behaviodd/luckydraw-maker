import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DrawInfoClient from './DrawInfoClient';

export default async function DrawInfoPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { id } = await params;

  // 서버 소유권 검증: 확률/아이템 상세 열람은 소유자만
  const { data: draw } = await supabase
    .from('lucky_draws')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!draw) redirect('/vault');

  return <DrawInfoClient id={id} />;
}
