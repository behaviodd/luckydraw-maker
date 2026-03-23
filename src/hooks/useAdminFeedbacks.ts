'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/uiStore';
import { useAdminFeedbackStore } from '@/stores/adminFeedbackStore';
import type { Feedback, FeedbackCategory } from '@/types';

function mapFeedback(row: Record<string, unknown>): Feedback {
  return {
    id: row.id as string,
    userId: row.user_id as string | null,
    senderEmail: row.sender_email as string,
    subject: row.subject as string,
    message: row.message as string,
    category: row.category as FeedbackCategory,
    isRead: row.is_read as boolean,
    createdAt: row.created_at as string,
  };
}

export function useAdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const addToast = useUIStore((s) => s.addToast);
  const setUnreadCount = useAdminFeedbackStore((s) => s.setUnreadCount);
  const decrementUnread = useAdminFeedbackStore((s) => s.decrementUnread);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      addToast({ type: 'error', message: '피드백을 불러오지 못했어요' });
    } else {
      const mapped = (data ?? []).map(mapFeedback);
      setFeedbacks(mapped);
      setUnreadCount(mapped.filter((f: Feedback) => !f.isRead).length);
    }
    setLoading(false);
  }, [supabase, addToast, setUnreadCount]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAll();
    });
  }, [fetchAll]);

  const unreadCount = feedbacks.filter((f) => !f.isRead).length;

  const markAsRead = useCallback(
    async (id: string) => {
      // 낙관적 업데이트
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isRead: true } : f)),
      );
      decrementUnread();

      const { error } = await supabase
        .from('feedbacks')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        // 롤백
        setFeedbacks((prev) => {
          const rolled = prev.map((f) => (f.id === id ? { ...f, isRead: false } : f));
          setUnreadCount(rolled.filter((f) => !f.isRead).length);
          return rolled;
        });
      }
    },
    [supabase, decrementUnread, setUnreadCount],
  );

  const deleteFeedback = useCallback(
    async (id: string) => {
      const target = feedbacks.find((f) => f.id === id);
      // 낙관적 삭제
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      if (target && !target.isRead) {
        decrementUnread();
      }

      const { error } = await supabase
        .from('feedbacks')
        .delete()
        .eq('id', id);

      if (error) {
        // 롤백
        addToast({ type: 'error', message: '삭제에 실패했어요' });
        void fetchAll();
      } else {
        addToast({ type: 'success', message: '피드백이 삭제되었어요' });
      }
    },
    [supabase, feedbacks, addToast, decrementUnread, fetchAll],
  );

  return { feedbacks, loading, unreadCount, markAsRead, deleteFeedback, refetch: fetchAll };
}
