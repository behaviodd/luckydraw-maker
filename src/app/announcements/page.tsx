import { createServerClient } from '@/lib/supabase/server';
import AnnouncementsListClient from './AnnouncementsListClient';

export default async function AnnouncementsPage() {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('announcements')
    .select('id, title, content, is_pinned, is_published, created_at, updated_at, author_id')
    .eq('is_published', true)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  const announcements = (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    isPinned: row.is_pinned as boolean,
    isPublished: row.is_published as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    authorId: row.author_id as string,
  }));

  return <AnnouncementsListClient announcements={announcements} />;
}
