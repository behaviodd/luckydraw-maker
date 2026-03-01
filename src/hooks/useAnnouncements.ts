'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { getAnnouncements, markAsRead as markAsReadApi } from '@/lib/announcements';
import type { AnnouncementWithReadStatus } from '@/types';

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<AnnouncementWithReadStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { user } = useAuth();
  const addToast = useUIStore((s) => s.addToast);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAnnouncements(supabase, user?.id);
      setAnnouncements(data);
    } catch {
      addToast({ type: 'error', message: '공지사항을 불러오지 못했어요' });
    } finally {
      setLoading(false);
    }
  }, [supabase, user?.id, addToast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Supabase Realtime: 새 공지 발행 시 자동 갱신
  useEffect(() => {
    const channel = supabase
      .channel('announcements_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          fetchAnnouncements();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchAnnouncements]);

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  /** 읽음 처리 (낙관적 업데이트) */
  const markAsRead = useCallback(
    async (announcementId: string) => {
      // 낙관적 업데이트
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcementId ? { ...a, isRead: true } : a,
        ),
      );
      try {
        await markAsReadApi(supabase, announcementId);
      } catch {
        // 실패 시 롤백
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === announcementId ? { ...a, isRead: false } : a,
          ),
        );
      }
    },
    [supabase],
  );

  return { announcements, loading, unreadCount, markAsRead, refetch: fetchAnnouncements };
}
