-- ============================================================
-- draw_results 테이블 생성
-- 목적: 뽑기 당첨 내역 로그 (분쟁 방지 + 운영 현황 파악)
-- ============================================================

CREATE TABLE IF NOT EXISTS draw_results (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id     uuid NOT NULL REFERENCES lucky_draws(id) ON DELETE CASCADE,
  item_id     uuid NOT NULL REFERENCES draw_items(id) ON DELETE CASCADE,
  item_name   text NOT NULL,
  item_image  text,
  tickets_used integer DEFAULT 1,
  created_at  timestamptz DEFAULT now()
);

-- RLS 활성화
ALTER TABLE draw_results ENABLE ROW LEVEL SECURITY;

-- 운영자: 본인 드로우 결과만 조회 가능
CREATE POLICY "results_owner_read" ON draw_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lucky_draws
      WHERE lucky_draws.id = draw_results.draw_id
      AND lucky_draws.user_id = auth.uid()
    )
  );

-- anon(비로그인 손님): 활성 드로우에만 INSERT 가능
CREATE POLICY "results_insert_anon" ON draw_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lucky_draws
      WHERE lucky_draws.id = draw_results.draw_id
      AND lucky_draws.is_active = true
    )
  );

-- 인덱스: 드로우별 최신순 조회 최적화
CREATE INDEX IF NOT EXISTS idx_draw_results_draw_id_created
  ON draw_results(draw_id, created_at DESC);
