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

-- Storage: 아이템 이미지
-- Supabase 대시보드에서 'draw-images' 버킷 생성 (public)
-- 정책: 인증된 사용자만 업로드, 누구나 읽기
