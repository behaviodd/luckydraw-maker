-- 1. remaining 컬럼 추가 및 backfill
ALTER TABLE draw_items ADD COLUMN IF NOT EXISTS remaining INTEGER;
UPDATE draw_items SET remaining = quantity WHERE remaining IS NULL;
ALTER TABLE draw_items ALTER COLUMN remaining SET NOT NULL;
ALTER TABLE draw_items ADD CONSTRAINT draw_items_remaining_non_negative CHECK (remaining >= 0);

-- 2. 공개 읽기 정책 (play 경로에서 비인증 사용자 접근용)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'draws_public_read') THEN
    CREATE POLICY "draws_public_read" ON lucky_draws FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'items_public_read') THEN
    CREATE POLICY "items_public_read" ON draw_items FOR SELECT USING (true);
  END IF;
END $$;

-- 3. 아이템 수량 차감 RPC (SECURITY DEFINER로 RLS 우회, 원자적 차감)
CREATE OR REPLACE FUNCTION decrement_item_quantity(p_item_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row draw_items%ROWTYPE;
BEGIN
  UPDATE draw_items SET remaining = remaining - 1
  WHERE id = p_item_id AND remaining > 0
  RETURNING * INTO v_row;
  IF v_row IS NULL THEN
    RETURN json_build_object('success', false);
  END IF;
  RETURN json_build_object('success', true, 'remaining', v_row.remaining);
END; $$;
