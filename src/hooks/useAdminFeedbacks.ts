'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/uiStore';
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

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      addToast({ type: 'error', message: '피드백을 불러오지 못했어요' });
    } else {
      setFeedbacks((data ?? []).map(mapFeedback));
    }
    setLoading(false);
  }, [supabase, addToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const unreadCount = feedbacks.filter((f) => !f.isRead).length;

  const markAsRead = useCallback(
    async (id: string) => {
      // 낙관적 업데이트
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isRead: true } : f)),
      );

      const { error } = await supabase
        .from('feedbacks')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        // 롤백
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, isRead: false } : f)),
        );
      }
    },
    [supabase],
  );

  return { feedbacks, loading, unreadCount, markAsRead, refetch: fetchAll };
}
