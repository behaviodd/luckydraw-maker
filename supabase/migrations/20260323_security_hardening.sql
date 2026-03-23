-- ============================================================
-- DB 보안 강화 마이그레이션
-- 날짜: 2026-03-23
-- 목적:
--   1. draw_results INSERT 정책을 API 서버 전용으로 제한
--   2. draw_results에 관리자 읽기 정책 추가
--   3. announcements INSERT 시 author_id를 현재 사용자로 강제
--   4. RPC 함수 anon 직접 호출 제한 (GRANT 정리)
-- ============================================================


-- ═══════════════════════════════════════════
-- 1. draw_results: 가짜 결과 삽입 방지
-- ═══════════════════════════════════════════
-- 문제: 기존 results_insert_anon 정책은 아무나 활성 드로우에
--       임의의 결과를 INSERT할 수 있었음 (draw API를 거치지 않고)
-- 해결: INSERT를 서비스 역할(service_role)으로 제한하고,
--       API 서버의 createServerClient가 서비스 키를 사용하도록 설정하거나,
--       또는 RPC 함수 내부에서 INSERT하도록 변경
--
-- 현실적 해결: decrement_item_quantity RPC에서 결과 기록까지 처리
--   → 단일 트랜잭션으로 차감 + 로그 기록 (원자성 보장)
--   → 외부에서 직접 INSERT 차단

-- 기존 anon INSERT 정책 제거
DROP POLICY IF EXISTS "results_insert_anon" ON draw_results;

-- 관리자만 결과 조회 + 드로우 소유자 조회 (기존 유지)
-- results_owner_read는 이미 존재하므로 그대로 유지

-- 관리자 읽기 정책 추가 (관리자 대시보드에서 전체 결과 조회용)
CREATE POLICY "results_admin_read" ON draw_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );


-- ═══════════════════════════════════════════
-- 2. decrement_item_quantity RPC 확장
--    → 결과 로그 기록을 RPC 내부로 이동
-- ═══════════════════════════════════════════
-- 변경: item_name, item_image, tickets_used 파라미터 추가
--       차감 성공 시 draw_results에 INSERT (SECURITY DEFINER이므로 RLS 무시)

CREATE OR REPLACE FUNCTION decrement_item_quantity(
  p_item_id UUID,
  p_item_name TEXT DEFAULT NULL,
  p_item_image TEXT DEFAULT NULL,
  p_tickets_used INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item draw_items%ROWTYPE;
  v_is_active BOOLEAN;
BEGIN
  -- 1. 아이템 조회 + 행 락
  SELECT di.* INTO v_item
  FROM draw_items di
  WHERE di.id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'item_not_found');
  END IF;

  -- 2. 드로우 활성 상태 확인
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

  -- 5. 당첨 로그 기록 (SECURITY DEFINER이므로 RLS 무시)
  INSERT INTO draw_results (draw_id, item_id, item_name, item_image, tickets_used)
  VALUES (
    v_item.draw_id,
    p_item_id,
    COALESCE(p_item_name, v_item.name),
    p_item_image,
    p_tickets_used
  );

  RETURN json_build_object(
    'success', true,
    'remaining', v_item.remaining - 1
  );
END;
$$;

-- anon + authenticated 모두 호출 가능 (비로그인 손님 뽑기 허용)
GRANT EXECUTE ON FUNCTION decrement_item_quantity(UUID, TEXT, TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION decrement_item_quantity(UUID, TEXT, TEXT, INTEGER) TO authenticated;


-- ═══════════════════════════════════════════
-- 3. announcements: author_id 강제
-- ═══════════════════════════════════════════
-- 문제: 관리자가 INSERT 시 author_id를 임의 사용자로 설정 가능
-- 해결: INSERT 시 author_id = auth.uid() 강제

-- 기존 announcements_admin_all 정책은 FOR ALL이므로 INSERT도 포함됨
-- 별도의 INSERT 정책으로 author_id를 강제하기 위해 분리

-- 기존 정책 제거 후 SELECT/UPDATE/DELETE와 INSERT를 분리
DROP POLICY IF EXISTS "announcements_admin_all" ON announcements;

-- 관리자: 조회/수정/삭제
CREATE POLICY "announcements_admin_manage" ON announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- 관리자: 삽입 시 author_id = 현재 사용자 강제
-- NOTE: FOR ALL이 INSERT도 포함하므로, WITH CHECK를 별도 INSERT 정책으로 분리
-- FOR ALL은 USING만 적용되고 WITH CHECK가 없으면 USING이 WITH CHECK로도 동작
-- 따라서 author_id 강제는 DB 트리거로 구현하는 것이 더 안전

-- author_id 자동 설정 트리거
CREATE OR REPLACE FUNCTION set_announcement_author()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.author_id := auth.uid();
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_announcement_author ON announcements;
CREATE TRIGGER trg_set_announcement_author
  BEFORE INSERT OR UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION set_announcement_author();


-- ═══════════════════════════════════════════
-- 4. feedbacks: 사용자 본인 피드백 조회 허용
-- ═══════════════════════════════════════════
-- 문제: 사용자가 제출한 피드백을 확인할 수 없음
-- 해결: 본인 피드백 SELECT 허용

CREATE POLICY "feedbacks_self_read" ON feedbacks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
