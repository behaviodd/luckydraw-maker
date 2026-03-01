import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DrawDetailClient from './DrawDetailClient';

export default async function DrawDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/vault?error=unauthorized');

  return <DrawDetailClient drawId={id} />;
}
