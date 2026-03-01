import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DrawClient from './DrawClient';

export default async function DrawPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { id } = await params;

  // 서버 소유권 검증: 드로우 운영은 소유자만
  const { data: draw } = await supabase
    .from('lucky_draws')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!draw) redirect('/vault');

  return <DrawClient id={id} />;
}
