import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FeedbacksClient from './FeedbacksClient';

export default async function FeedbacksPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/vault?error=unauthorized');

  return <FeedbacksClient />;
}
