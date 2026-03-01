'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/uiStore';
import type { AdminDraw, ProbabilityMode } from '@/types';

function mapDraw(row: Record<string, unknown>): AdminDraw {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    drawButtonLabel: row.draw_button_label as string,
    probabilityMode: row.probability_mode as ProbabilityMode,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    ownerDisplayName: row.owner_display_name as string | null,
    ownerEmail: row.owner_email as string,
    ownerAvatarUrl: row.owner_avatar_url as string | null,
    itemCount: Number(row.item_count ?? 0),
    totalQuantity: Number(row.total_quantity ?? 0),
    totalRemaining: Number(row.total_remaining ?? 0),
  };
}

export function useAdminDraws() {
  const [draws, setDraws] = useState<AdminDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const addToast = useUIStore((s) => s.addToast);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_admin_draws');

    if (error) {
      addToast({ type: 'error', message: '럭키드로우 목록을 불러오지 못했어요' });
    } else {
      setDraws((data ?? []).map(mapDraw));
    }
    setLoading(false);
  }, [supabase, addToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleActive = useCallback(
    async (drawId: string, isActive: boolean) => {
      setDraws((prev) =>
        prev.map((d) => (d.id === drawId ? { ...d, isActive } : d)),
      );

      const { error } = await supabase.rpc('admin_toggle_draw_active', {
        p_draw_id: drawId,
        p_is_active: isActive,
      });

      if (error) {
        setDraws((prev) =>
          prev.map((d) => (d.id === drawId ? { ...d, isActive: !isActive } : d)),
        );
        addToast({ type: 'error', message: '상태 변경에 실패했어요' });
      } else {
        addToast({ type: 'success', message: isActive ? '럭키드로우가 활성화되었어요' : '럭키드로우가 비활성화되었어요' });
      }
    },
    [supabase, addToast],
  );

  const deleteDraw = useCallback(
    async (drawId: string) => {
      const prev = draws;
      setDraws((p) => p.filter((d) => d.id !== drawId));

      const { error } = await supabase.rpc('admin_delete_draw', {
        p_draw_id: drawId,
      });

      if (error) {
        setDraws(prev);
        addToast({ type: 'error', message: '럭키드로우 삭제에 실패했어요' });
      } else {
        addToast({ type: 'success', message: '럭키드로우가 삭제되었어요' });
      }
    },
    [supabase, addToast, draws],
  );

  return { draws, loading, toggleActive, deleteDraw };
}
