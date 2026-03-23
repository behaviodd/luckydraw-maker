'use client';

import { useEffect, useState, useCallback } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
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
    ticketOptions: (row.ticket_options as number[] | null) ?? [1, 2, 3, 5, 10],
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
      .select('id, name, draw_button_label, probability_mode, is_active, ticket_options, created_at, updated_at, draw_items(id, draw_id, name, quantity, remaining, image_url, sort_order)')
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
    queueMicrotask(() => {
      void fetchDraws();
    });
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

/**
 * @param requireOwnership true이면 draw.userId !== 현재 유저 시 null 반환 (소유권 이중 검증)
 * @param enableRealtime true이면 draw_items 변경을 실시간 구독 (현장 대시보드용)
 */
export function useLuckyDraw(id: string, requireOwnership = false, enableRealtime = false) {
  const [draw, setDraw] = useState<LuckyDraw | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('lucky_draws')
        .select('id, user_id, name, draw_button_label, probability_mode, is_active, ticket_options, created_at, updated_at, draw_items(id, draw_id, name, quantity, remaining, image_url, sort_order)')
        .eq('id', id)
        .single();

      if (data) {
        const mapped = mapDraw(data);

        // 원칙 3: 소유권 이중 검증 — RLS + 클라이언트 검증
        if (requireOwnership) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || mapped.userId !== user.id) {
            setDraw(null);
            setLoading(false);
            return;
          }
        }

        setDraw(mapped);
      }
      setLoading(false);
    };
    fetch();
  }, [id, supabase, requireOwnership]);

  // Supabase Realtime: draw_items 재고 변경 실시간 구독
  const hasDraw = draw !== null;

  useEffect(() => {
    if (!enableRealtime || !hasDraw) return;

    const channel = supabase
      .channel(`draw-items-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'draw_items',
          filter: `draw_id=eq.${id}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const updated = payload.new as Record<string, unknown>;
          setDraw((prev) => {
            if (!prev?.items) return prev;
            return {
              ...prev,
              items: prev.items.map((item) =>
                item.id === updated.id
                  ? { ...item, remaining: updated.remaining as number }
                  : item
              ),
            };
          });

          // 재고 20% 이하 브라우저 알림
          const remaining = updated.remaining as number;
          const quantity = updated.quantity as number;
          const name = updated.name as string;
          if (remaining > 0 && remaining / quantity < 0.2) {
            if (typeof Notification !== 'undefined') {
              if (Notification.permission === 'default') {
                Notification.requestPermission();
              }
              if (Notification.permission === 'granted') {
                new Notification('재고 부족', {
                  body: `${name} ${remaining}개 남음`,
                  icon: '/favicon.ico',
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, hasDraw, id, supabase]);

  return { draw, setDraw, loading };
}
