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

-- lucky_draws: 누구나 읽기 (play 경로용)
CREATE POLICY "draws_public_read" ON lucky_draws
  FOR SELECT USING (true);

-- draw_items: 누구나 읽기 (play 경로용)
CREATE POLICY "items_public_read" ON draw_items
  FOR SELECT USING (true);

-- remaining 컬럼: 남은 수량 추적
ALTER TABLE draw_items ADD COLUMN remaining INTEGER;
UPDATE draw_items SET remaining = quantity WHERE remaining IS NULL;
ALTER TABLE draw_items ALTER COLUMN remaining SET NOT NULL;
ALTER TABLE draw_items ADD CONSTRAINT draw_items_remaining_non_negative CHECK (remaining >= 0);

-- 아이템 수량 차감 RPC (SECURITY DEFINER로 RLS 우회)
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

-- Storage: 아이템 이미지
-- Supabase 대시보드에서 'draw-images' 버킷 생성 (public)
-- 정책: 인증된 사용자만 업로드, 누구나 읽기

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
