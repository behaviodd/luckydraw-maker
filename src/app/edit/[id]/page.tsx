import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditClient from './EditClient';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { id } = await params;

  // 서버 소유권 검증: RLS 외 이중 검증
  const { data: draw } = await supabase
    .from('lucky_draws')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!draw) redirect('/vault');

  return <EditClient id={id} />;
}
