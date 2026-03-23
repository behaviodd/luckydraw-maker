-- 사용자 프로필 (auth.users 확장)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 럭키드로우
CREATE TABLE lucky_draws (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  draw_button_label TEXT NOT NULL DEFAULT '두근두근 뽑기!',
  probability_mode TEXT NOT NULL CHECK (probability_mode IN ('equal', 'weighted')),
  is_active       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 럭키드로우 아이템
CREATE TABLE draw_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id     UUID NOT NULL REFERENCES lucky_draws(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  image_url   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_items ENABLE ROW LEVEL SECURITY;

-- profiles: 본인만 읽기/수정
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (auth.uid() = id);

-- lucky_draws: 본인만 CRUD
CREATE POLICY "draws_owner" ON lucky_draws
  FOR ALL USING (auth.uid() = user_id);

-- draw_items: draw 소유자만 CRUD
CREATE POLICY "items_owner" ON draw_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lucky_draws
      WHERE lucky_draws.id = draw_items.draw_id
        AND lucky_draws.user_id = auth.uid()
    )
  );

-- lucky_draws: 인증된 사용자만 읽기 (play 경로용, anon 차단)
CREATE POLICY "draws_authenticated_read" ON lucky_draws
  FOR SELECT TO authenticated USING (true);

-- draw_items: 인증된 사용자만 읽기 (play 경로용, anon 차단)
CREATE POLICY "items_authenticated_read" ON draw_items
  FOR SELECT TO authenticated USING (true);

-- remaining 컬럼: 남은 수량 추적
ALTER TABLE draw_items ADD COLUMN remaining INTEGER;
UPDATE draw_items SET remaining = quantity WHERE remaining IS NULL;
ALTER TABLE draw_items ALTER COLUMN remaining SET NOT NULL;
ALTER TABLE draw_items ADD CONSTRAINT draw_items_remaining_non_negative CHECK (remaining >= 0);

-- 아이템 수량 차감 RPC (SECURITY DEFINER + 인증 필수)
CREATE OR REPLACE FUNCTION decrement_item_quantity(p_item_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row draw_items%ROWTYPE;
BEGIN
  -- 인증 검증: 비인증 사용자 차단
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;

  UPDATE draw_items SET remaining = remaining - 1
  WHERE id = p_item_id AND remaining > 0
  RETURNING * INTO v_row;
  IF v_row IS NULL THEN
    RETURN json_build_object('success', false);
  END IF;
  RETURN json_build_object('success', true, 'remaining', v_row.remaining);
END; $$;

-- ═══════════════════════════════════════════
-- Storage: 아이템 이미지
-- ═══════════════════════════════════════════
-- 사전 조건: Supabase 대시보드 → Storage → New bucket
--   이름: "draw-images", Public 체크 후 생성

-- 업로드: 인증된 사용자, 본인 폴더({userId}/)에만
CREATE POLICY "images_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'draw-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 수정: 본인 파일만 덮어쓰기 가능
CREATE POLICY "images_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'draw-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 삭제: 본인 파일만 삭제 가능
CREATE POLICY "images_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'draw-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 읽기: 공개 버킷이므로 누구나 읽기 가능 (드로우/플레이에서 이미지 표시용)
CREATE POLICY "images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'draw-images');

-- ═══════════════════════════════════════════
-- 관리자 권한
-- ═══════════════════════════════════════════
CREATE TABLE admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW()
);
-- 관리자 추가는 Supabase 대시보드 SQL 에디터에서 직접 수행:
-- INSERT INTO admins (user_id) VALUES ('관리자-uuid');

-- ═══════════════════════════════════════════
-- 공지사항
-- ═══════════════════════════════════════════
CREATE TABLE announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  is_pinned    BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  author_id    UUID REFERENCES auth.users(id)
);

-- 사용자별 읽음 여부 (안 읽은 공지 뱃지용)
CREATE TABLE announcement_reads (
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, announcement_id)
);

-- ═══════════════════════════════════════════
-- RLS: admins / announcements / announcement_reads
-- ═══════════════════════════════════════════
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_self_read" ON admins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "announcements_public_read" ON announcements
  FOR SELECT USING (is_published = true);

CREATE POLICY "announcements_admin_all" ON announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "reads_self" ON announcement_reads
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════
-- 관리자 여부 확인 RPC
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

-- ═══════════════════════════════════════════
-- 피드백
-- ═══════════════════════════════════════════
CREATE TABLE feedbacks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_email TEXT NOT NULL,
  subject      TEXT NOT NULL,
  message      TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'general', 'other')),
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 자신의 피드백만 삽입 가능
CREATE POLICY "feedbacks_insert_own" ON feedbacks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 피드백 조회 가능
CREATE POLICY "feedbacks_admin_read" ON feedbacks
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- 관리자는 피드백 읽음 상태 업데이트 가능
CREATE POLICY "feedbacks_admin_update" ON feedbacks
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- 관리자는 피드백 삭제 가능
CREATE POLICY "feedbacks_admin_delete" ON feedbacks
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- 사용자는 본인 피드백 조회 가능
CREATE POLICY "feedbacks_self_read" ON feedbacks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
