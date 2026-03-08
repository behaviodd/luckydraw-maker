import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AnnouncementPageClient from './AnnouncementPageClient';

export default async function AnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('announcements')
    .select('id, title, content, is_pinned, is_published, created_at, updated_at, author_id')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (!data) {
    redirect('/');
  }

  return (
    <AnnouncementPageClient
      announcement={{
        id: data.id,
        title: data.title,
        content: data.content,
        isPinned: data.is_pinned,
        isPublished: data.is_published,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        authorId: data.author_id,
      }}
    />
  );
}
