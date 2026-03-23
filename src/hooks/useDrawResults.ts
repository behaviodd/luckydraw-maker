'use client';

import { useEffect, useState, useCallback } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { DrawResultLog } from '@/types';

function mapResult(row: Record<string, unknown>): DrawResultLog {
  return {
    id: row.id as string,
    drawId: row.draw_id as string,
    itemId: row.item_id as string,
    itemName: row.item_name as string,
    itemImage: (row.item_image as string | null) ?? null,
    ticketsUsed: (row.tickets_used as number) ?? 1,
    createdAt: row.created_at as string,
  };
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

interface UseDrawResultsOptions {
  drawId: string;
  enabled?: boolean;
}

interface UseDrawResultsReturn {
  results: DrawResultLog[];
  todayCount: number;
  isLoading: boolean;
}

export function useDrawResults({ drawId, enabled = true }: UseDrawResultsOptions): UseDrawResultsReturn {
  const [results, setResults] = useState<DrawResultLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchResults = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('draw_results')
      .select('*')
      .eq('draw_id', drawId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setResults(data.map(mapResult));
    }
    setIsLoading(false);
  }, [supabase, drawId, enabled]);

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() => {
        setIsLoading(false);
      });
      return;
    }
    queueMicrotask(() => {
      void fetchResults();
    });
  }, [fetchResults, enabled]);

  // Realtime: 새 당첨 INSERT 감지
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`draw-results-${drawId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'draw_results',
          filter: `draw_id=eq.${drawId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const newResult = mapResult(payload.new as Record<string, unknown>);
          setResults((prev) => {
            // 중복 방지
            if (prev.some((r) => r.id === newResult.id)) return prev;
            return [newResult, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, drawId, enabled]);

  const todayCount = results.filter((r) => isToday(r.createdAt)).length;

  return { results, todayCount, isLoading };
}
