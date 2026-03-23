'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/uiStore';
import type { AdminUser } from '@/types';

function mapUser(row: Record<string, unknown>): AdminUser {
  return {
    id: row.id as string,
    email: row.email as string,
    displayName: row.display_name as string | null,
    avatarUrl: row.avatar_url as string | null,
    createdAt: row.created_at as string,
    isAdmin: row.is_admin as boolean,
    drawCount: Number(row.draw_count ?? 0),
  };
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const addToast = useUIStore((s) => s.addToast);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_admin_users');

    if (error) {
      addToast({ type: 'error', message: '회원 목록을 불러오지 못했어요' });
    } else {
      setUsers((data ?? []).map(mapUser));
    }
    setLoading(false);
  }, [supabase, addToast]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAll();
    });
  }, [fetchAll]);

  const toggleAdmin = useCallback(
    async (userId: string, grant: boolean) => {
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAdmin: grant } : u)),
      );

      const { error } = await supabase.rpc('admin_toggle_admin', {
        p_user_id: userId,
        p_grant: grant,
      });

      if (error) {
        // Rollback
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isAdmin: !grant } : u)),
        );
        addToast({ type: 'error', message: error.message.includes('own admin') ? '본인의 관리자 권한은 해제할 수 없어요' : '권한 변경에 실패했어요' });
      } else {
        addToast({ type: 'success', message: grant ? '관리자 권한을 부여했어요' : '관리자 권한을 해제했어요' });
      }
    },
    [supabase, addToast],
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      const prev = users;
      setUsers((p) => p.filter((u) => u.id !== userId));

      const { error } = await supabase.rpc('admin_delete_user', {
        p_user_id: userId,
      });

      if (error) {
        setUsers(prev);
        addToast({ type: 'error', message: error.message.includes('self') ? '본인 계정은 삭제할 수 없어요' : '회원 삭제에 실패했어요' });
      } else {
        addToast({ type: 'success', message: '회원이 삭제되었어요' });
      }
    },
    [supabase, addToast, users],
  );

  return { users, loading, toggleAdmin, deleteUser };
}
