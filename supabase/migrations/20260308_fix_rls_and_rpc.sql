-- ============================================================
-- RLS 정책 수정 및 RPC 보안 강화
-- 날짜: 2026-03-08
-- 목적:
--   1. lucky_draws / draw_items의 과도한 공개 읽기 정책 제거
--   2. 비로그인 손님용 최소 읽기 정책 추가 (활성 드로우만)
--   3. decrement_item_quantity RPC에 is_active 검증 + FOR UPDATE 락 추가
--   4. 비로그인(anon) 손님의 뽑기 허용
-- ============================================================

-- ═══════════════════════════════════════════
-- 1. lucky_draws 정책 수정
-- ═══════════════════════════════════════════

-- 문제: USING(true)로 누구나 전체 드로우 조회 가능 → 운영자 간 데이터 격리 실패
DROP POLICY IF EXISTS "draws_public_read" ON lucky_draws;
DROP POLICY IF EXISTS "draws_authenticated_read" ON lucky_draws;

-- 새 정책: 비로그인 손님은 활성화된 드로우만 조회 가능
-- RLS는 컬럼 단위 제한이 불가하므로, 행 단위로 is_active=true만 허용
-- 프론트엔드에서 최소 필드만 SELECT하도록 코드로 제어
CREATE POLICY "draws_public_active_read" ON lucky_draws
  FOR SELECT
  TO anon
  USING (is_active = true);

-- 참고: draws_owner (FOR ALL USING auth.uid() = user_id) 정책은 유지
-- → 운영자는 본인 드로우만 전체 CRUD 가능

-- ═══════════════════════════════════════════
-- 2. draw_items 정책 수정
-- ═══════════════════════════════════════════

-- 문제: USING(true)로 quantity/remaining 등 민감 데이터 전체 노출
DROP POLICY IF EXISTS "items_public_read" ON draw_items;
DROP POLICY IF EXISTS "items_authenticated_read" ON draw_items;

-- 새 정책: 비로그인 손님은 활성 드로우에 속한 아이템만 조회 가능
-- 뽑기 API(서버)에서 아이템 목록 조회 시 필요
CREATE POLICY "items_public_active_read" ON draw_items
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM lucky_draws
      WHERE lucky_draws.id = draw_items.draw_id
        AND lucky_draws.is_active = true
    )
  );

-- 참고: items_owner (FOR ALL, 드로우 소유자 확인) 정책은 유지
-- → 운영자는 본인 드로우의 아이템만 전체 CRUD 가능

-- ═══════════════════════════════════════════
-- 3. decrement_item_quantity RPC 수정
-- ═══════════════════════════════════════════
-- 변경사항:
--   (A) auth.uid() IS NULL 체크 제거 → 비로그인 손님도 호출 가능
--   (B) is_active = true 검증 추가 → 비활성 드로우 차감 방지
--   (C) FOR UPDATE 락 추가 → 동시 요청 시 정합성 보장
--   (D) 아이템→드로우 조인으로 단일 쿼리 검증

CREATE OR REPLACE FUNCTION decrement_item_quantity(p_item_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item draw_items%ROWTYPE;
  v_is_active BOOLEAN;
BEGIN
  -- 1. 아이템 조회 + 행 락 (동시 요청 시 순차 처리 보장)
  SELECT di.* INTO v_item
  FROM draw_items di
  WHERE di.id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'item_not_found');
  END IF;

  -- 2. 해당 드로우의 활성 상태 확인
  SELECT ld.is_active INTO v_is_active
  FROM lucky_draws ld
  WHERE ld.id = v_item.draw_id;

  IF NOT v_is_active THEN
    RETURN json_build_object('success', false, 'error', 'draw_not_active');
  END IF;

  -- 3. 재고 확인
  IF v_item.remaining <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'no_remaining');
  END IF;

  -- 4. 재고 차감
  UPDATE draw_items
  SET remaining = remaining - 1
  WHERE id = p_item_id;

  RETURN json_build_object(
    'success', true,
    'remaining', v_item.remaining - 1
  );
END;
$$;

-- 비로그인(anon) 손님도 RPC 호출 가능하도록 권한 부여
-- 기존 authenticated 권한도 명시적으로 유지
GRANT EXECUTE ON FUNCTION decrement_item_quantity(UUID) TO anon;
GRANT EXECUTE ON FUNCTION decrement_item_quantity(UUID) TO authenticated;
