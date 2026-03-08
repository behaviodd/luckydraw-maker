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

  // count 파라미터 (한번에 뽑기용, 기본 1, 최대 10)
  let count = 1;
  try {
    const body = await request.json().catch(() => ({}));
    if (body.count && typeof body.count === 'number' && body.count >= 1) {
      count = Math.min(Math.floor(body.count), 10);
    }
  } catch { /* body 없으면 기본값 */ }

  // Rate Limit: IP + 드로우별 분당 30회 (한번에 뽑기 고려)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') ?? 'unknown';
  const { allowed } = checkRateLimit(`draw-pick:${id}:${ip}`, 30, 60_000);
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
  const probabilityMode = draw.probability_mode;

  // 로컬 remaining 복사본 (반복 추첨 시 차감 반영)
  const localRemaining = new Map(items.map((item) => [item.id, item.remaining]));

  function pickWinner() {
    const available = items.filter((item) => (localRemaining.get(item.id) ?? 0) > 0);
    if (available.length === 0) return null;

    if (probabilityMode === 'equal') {
      return available[Math.floor(Math.random() * available.length)];
    }
    // weighted: remaining 가중치
    const totalRemaining = available.reduce((sum, item) => sum + (localRemaining.get(item.id) ?? 0), 0);
    let random = Math.random() * totalRemaining;
    let winner = available[available.length - 1];
    for (const item of available) {
      random -= localRemaining.get(item.id) ?? 0;
      if (random <= 0) { winner = item; break; }
    }
    return winner;
  }

  // 단건 추첨 (count === 1)
  if (count === 1) {
    const winner = pickWinner();
    if (!winner) {
      return NextResponse.json({ success: false, exhausted: true });
    }

    const { data: rpcResult } = await supabase.rpc('decrement_item_quantity', {
      p_item_id: winner.id,
    });

    if (!rpcResult?.success) {
      if (rpcResult?.error === 'draw_not_active') {
        return NextResponse.json({ success: false, error: 'draw_not_active' }, { status: 403 });
      }
      return NextResponse.json({ success: false, error: 'item_exhausted_retry' });
    }

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

  // 복수 추첨 (count > 1)
  const results: { id: string; name: string; imageUrl: string | null; remaining: number }[] = [];

  for (let i = 0; i < count; i++) {
    const winner = pickWinner();
    if (!winner) break; // 재고 소진

    const { data: rpcResult } = await supabase.rpc('decrement_item_quantity', {
      p_item_id: winner.id,
    });

    if (!rpcResult?.success) {
      if (rpcResult?.error === 'draw_not_active') {
        // 이미 뽑은 것들이 있으면 부분 결과 반환
        if (results.length > 0) break;
        return NextResponse.json({ success: false, error: 'draw_not_active' }, { status: 403 });
      }
      continue; // 해당 아이템 소진 → 다음 시도
    }

    // 로컬 remaining 갱신 (다음 추첨에 반영)
    localRemaining.set(winner.id, rpcResult.remaining);

    results.push({
      id: winner.id,
      name: winner.name,
      imageUrl: winner.image_url,
      remaining: rpcResult.remaining,
    });
  }

  if (results.length === 0) {
    return NextResponse.json({ success: false, exhausted: true });
  }

  return NextResponse.json({
    success: true,
    bulk: true,
    items: results,
    count: results.length,
  });
}
