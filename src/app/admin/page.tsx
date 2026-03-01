import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // 관리자 권한 2차 검증 (미들웨어 + 서버 컴포넌트 이중 검증)
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/vault?error=unauthorized');

  return <AdminClient />;
}
