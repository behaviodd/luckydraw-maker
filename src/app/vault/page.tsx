import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import VaultClient from './VaultClient';

export default async function VaultPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  return <VaultClient />;
}
