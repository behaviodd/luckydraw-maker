'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/uiStore';
import type { AdminDrawDetail, DrawItem, LuckyDraw, ProbabilityMode } from '@/types';

function mapDetail(raw: Record<string, unknown>): AdminDrawDetail {
  const d = raw.draw as Record<string, unknown>;
  const items = raw.items as Record<string, unknown>[];
  const owner = raw.owner as Record<string, unknown>;

  return {
    draw: {
      id: d.id as string,
      userId: d.user_id as string,
      name: d.name as string,
      drawButtonLabel: d.draw_button_label as string,
      probabilityMode: d.probability_mode as ProbabilityMode,
      isActive: d.is_active as boolean,
      createdAt: d.created_at as string,
      updatedAt: d.updated_at as string,
    } as LuckyDraw,
    items: items.map(
      (i) =>
        ({
          id: i.id as string,
          drawId: i.draw_id as string,
          name: i.name as string,
          quantity: i.quantity as number,
          remaining: i.remaining as number,
          imageUrl: i.image_url as string | null,
          sortOrder: i.sort_order as number,
        }) as DrawItem,
    ),
    owner: {
      displayName: owner.display_name as string | null,
      avatarUrl: owner.avatar_url as string | null,
      email: owner.email as string,
    },
  };
}

export function useAdminDrawDetail(drawId: string) {
  const [detail, setDetail] = useState<AdminDrawDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const addToast = useUIStore((s) => s.addToast);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_get_draw_detail', {
      p_draw_id: drawId,
    });

    if (error) {
      addToast({ type: 'error', message: '럭키드로우 상세를 불러오지 못했어요' });
    } else if (data) {
      setDetail(mapDetail(data as Record<string, unknown>));
    }
    setLoading(false);
  }, [supabase, addToast, drawId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { detail, loading };
}
