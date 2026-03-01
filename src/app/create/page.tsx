import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CreateClient from './CreateClient';

export default async function CreatePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  return <CreateClient />;
}
