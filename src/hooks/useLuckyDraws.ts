'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/uiStore';
import type { LuckyDraw, DrawItem } from '@/types';

function mapDraw(row: Record<string, unknown>): LuckyDraw {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    drawButtonLabel: row.draw_button_label as string,
    probabilityMode: row.probability_mode as 'equal' | 'weighted',
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    items: Array.isArray(row.draw_items)
      ? (row.draw_items as Record<string, unknown>[]).map(mapItem)
      : undefined,
  };
}

function mapItem(row: Record<string, unknown>): DrawItem {
  return {
    id: row.id as string,
    drawId: row.draw_id as string,
    name: row.name as string,
    quantity: row.quantity as number,
    remaining: (row.remaining as number) ?? (row.quantity as number),
    imageUrl: row.image_url as string | null,
    sortOrder: row.sort_order as number,
  };
}

export function useLuckyDraws(userId?: string) {
  const [draws, setDraws] = useState<LuckyDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const addToast = useUIStore((s) => s.addToast);

  const fetchDraws = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('lucky_draws')
      .select('*, draw_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      addToast({ type: 'error', message: '데이터를 불러오지 못했어요' });
    } else {
      setDraws((data ?? []).map(mapDraw));
    }
    setLoading(false);
  }, [supabase, addToast, userId]);

  useEffect(() => {
    fetchDraws();
  }, [fetchDraws]);

  const deleteDraw = async (id: string) => {
    setDraws((prev) => prev.filter((d) => d.id !== id));
    const { error } = await supabase.from('lucky_draws').delete().eq('id', id);
    if (error) {
      addToast({ type: 'error', message: '삭제에 실패했어요' });
      fetchDraws();
    } else {
      addToast({ type: 'success', message: '럭키드로우가 삭제되었어요' });
    }
  };

  return { draws, loading, fetchDraws, deleteDraw };
}

export function useLuckyDraw(id: string) {
  const [draw, setDraw] = useState<LuckyDraw | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('lucky_draws')
        .select('*, draw_items(*)')
        .eq('id', id)
        .single();

      if (data) {
        setDraw(mapDraw(data));
      }
      setLoading(false);
    };
    fetch();
  }, [id, supabase]);

  return { draw, setDraw, loading };
}
