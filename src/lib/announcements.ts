import type { SupabaseClient } from '@supabase/supabase-js';
import type { Announcement, AnnouncementWithReadStatus } from '@/types';

function mapAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    isPinned: row.is_pinned as boolean,
    isPublished: row.is_published as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    authorId: row.author_id as string,
  };
}

/** 공지 목록 조회 (읽음 여부 포함, is_pinned DESC → created_at DESC) */
export async function getAnnouncements(
  supabase: SupabaseClient,
  userId: string | undefined,
): Promise<AnnouncementWithReadStatus[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, announcement_reads(user_id)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const reads = row.announcement_reads as Record<string, unknown>[] | null;
    const isRead = userId
      ? (reads ?? []).some((r) => r.user_id === userId)
      : false;
    return { ...mapAnnouncement(row), isRead };
  });
}

/** 단건 조회 */
export async function getAnnouncement(
  supabase: SupabaseClient,
  id: string,
): Promise<Announcement> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapAnnouncement(data);
}

/** 읽음 처리 */
export async function markAsRead(
  supabase: SupabaseClient,
  announcementId: string,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('announcement_reads')
    .upsert({ user_id: user.id, announcement_id: announcementId });
}

/** 관리자 전용: 공지 생성 */
export async function createAnnouncement(
  supabase: SupabaseClient,
  data: { title: string; content: string; isPinned?: boolean; isPublished?: boolean },
): Promise<Announcement> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: row, error } = await supabase
    .from('announcements')
    .insert({
      title: data.title,
      content: data.content,
      is_pinned: data.isPinned ?? false,
      is_published: data.isPublished ?? false,
      author_id: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return mapAnnouncement(row);
}

/** 관리자 전용: 공지 수정 */
export async function updateAnnouncement(
  supabase: SupabaseClient,
  id: string,
  data: { title?: string; content?: string; isPinned?: boolean; isPublished?: boolean },
): Promise<Announcement> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.content !== undefined) updates.content = data.content;
  if (data.isPinned !== undefined) updates.is_pinned = data.isPinned;
  if (data.isPublished !== undefined) updates.is_published = data.isPublished;

  const { data: row, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapAnnouncement(row);
}

/** 관리자 전용: 공지 삭제 */
export async function deleteAnnouncement(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/** 관리자 전용: 발행 토글 */
export async function togglePublish(
  supabase: SupabaseClient,
  id: string,
  isPublished: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}
