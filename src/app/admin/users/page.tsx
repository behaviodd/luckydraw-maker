import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/vault?error=unauthorized');

  return <UsersClient />;
}
