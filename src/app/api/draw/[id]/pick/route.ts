import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerClient();
  const { id } = await params;

  // 입력 검증: UUID 형식
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ success: false, error: 'invalid_id' }, { status: 400 });
  }

  // Rate Limit: IP + 드로우별 분당 10회
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') ?? 'unknown';
  const { allowed } = checkRateLimit(`draw-pick:${id}:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'rate_limited' },
      { status: 429 },
    );
  }

  // 드로우 + 아이템 조회 (서버에서만 quantity/remaining 접근)
  // RLS: anon은 is_active=true인 드로우/아이템만 조회 가능
  const { data: draw, error: drawError } = await supabase
    .from('lucky_draws')
    .select('id, probability_mode, draw_items(id, name, remaining, image_url)')
    .eq('id', id)
    .single();

  if (drawError || !draw) {
    return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 });
  }

  const items = (draw.draw_items as { id: string; name: string; remaining: number; image_url: string | null }[]) ?? [];
  const available = items.filter((item) => item.remaining > 0);

  if (available.length === 0) {
    return NextResponse.json({ success: false, exhausted: true });
  }

  // 서버 추첨 로직
  let winner: typeof available[0];

  if (draw.probability_mode === 'equal') {
    winner = available[Math.floor(Math.random() * available.length)];
  } else {
    // weighted: remaining 가중치
    const totalRemaining = available.reduce((sum, item) => sum + item.remaining, 0);
    let random = Math.random() * totalRemaining;
    winner = available[available.length - 1]; // fallback
    for (const item of available) {
      random -= item.remaining;
      if (random <= 0) {
        winner = item;
        break;
      }
    }
  }

  // 수량 차감 (atomic RPC — SECURITY DEFINER, is_active 검증 포함)
  const { data: rpcResult } = await supabase.rpc('decrement_item_quantity', {
    p_item_id: winner.id,
  });

  if (!rpcResult?.success) {
    if (rpcResult?.error === 'draw_not_active') {
      return NextResponse.json({ success: false, error: 'draw_not_active' }, { status: 403 });
    }
    // 동시 요청으로 소진된 경우
    return NextResponse.json({ success: false, error: 'item_exhausted_retry' });
  }

  // 클라이언트에는 결과만 반환 (quantity, remaining 미포함)
  return NextResponse.json({
    success: true,
    item: {
      id: winner.id,
      name: winner.name,
      imageUrl: winner.image_url,
    },
    remaining: rpcResult.remaining,
  });
}
