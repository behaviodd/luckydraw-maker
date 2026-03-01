-- ============================================================
-- 관리자 회원관리 + 럭키드로우 관리 RPC 함수
-- ============================================================

-- 1. get_admin_users(): 전체 회원 목록 (profiles + auth.users email + admin 여부 + 럭드 수)
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE (
  id           UUID,
  email        TEXT,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ,
  is_admin     BOOLEAN,
  draw_count   BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 권한 검증
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT
      p.id,
      au.email::TEXT,
      p.display_name,
      p.avatar_url,
      p.created_at,
      EXISTS (SELECT 1 FROM admins a WHERE a.user_id = p.id) AS is_admin,
      (SELECT COUNT(*) FROM lucky_draws ld WHERE ld.user_id = p.id) AS draw_count
    FROM profiles p
    JOIN auth.users au ON au.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

-- 2. get_admin_draws(): 전체 럭드 목록 (lucky_draws + 소유자 정보 + 아이템 통계)
CREATE OR REPLACE FUNCTION get_admin_draws()
RETURNS TABLE (
  id               UUID,
  user_id          UUID,
  name             TEXT,
  draw_button_label TEXT,
  probability_mode TEXT,
  is_active        BOOLEAN,
  created_at       TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ,
  owner_display_name TEXT,
  owner_email      TEXT,
  owner_avatar_url TEXT,
  item_count       BIGINT,
  total_quantity   BIGINT,
  total_remaining  BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins adm WHERE adm.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT
      ld.id,
      ld.user_id,
      ld.name,
      ld.draw_button_label,
      ld.probability_mode,
      ld.is_active,
      ld.created_at,
      ld.updated_at,
      p.display_name AS owner_display_name,
      au.email::TEXT AS owner_email,
      p.avatar_url AS owner_avatar_url,
      COALESCE(stats.cnt, 0) AS item_count,
      COALESCE(stats.qty, 0) AS total_quantity,
      COALESCE(stats.rem, 0) AS total_remaining
    FROM lucky_draws ld
    JOIN profiles p ON p.id = ld.user_id
    JOIN auth.users au ON au.id = ld.user_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) AS cnt,
        SUM(di.quantity) AS qty,
        SUM(di.remaining) AS rem
      FROM draw_items di
      WHERE di.draw_id = ld.id
    ) stats ON TRUE
    ORDER BY ld.created_at DESC;
END;
$$;

-- 3. admin_get_draw_detail(p_draw_id): 단일 럭드 상세 JSON 반환
CREATE OR REPLACE FUNCTION admin_get_draw_detail(p_draw_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'draw', json_build_object(
      'id', ld.id,
      'user_id', ld.user_id,
      'name', ld.name,
      'draw_button_label', ld.draw_button_label,
      'probability_mode', ld.probability_mode,
      'is_active', ld.is_active,
      'created_at', ld.created_at,
      'updated_at', ld.updated_at
    ),
    'items', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', di.id,
          'draw_id', di.draw_id,
          'name', di.name,
          'quantity', di.quantity,
          'remaining', di.remaining,
          'image_url', di.image_url,
          'sort_order', di.sort_order
        ) ORDER BY di.sort_order
      )
      FROM draw_items di WHERE di.draw_id = ld.id
    ), '[]'::json),
    'owner', json_build_object(
      'display_name', p.display_name,
      'avatar_url', p.avatar_url,
      'email', au.email
    )
  ) INTO result
  FROM lucky_draws ld
  JOIN profiles p ON p.id = ld.user_id
  JOIN auth.users au ON au.id = ld.user_id
  WHERE ld.id = p_draw_id;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Draw not found';
  END IF;

  RETURN result;
END;
$$;

-- 4. admin_toggle_admin(p_user_id, p_grant): 관리자 권한 부여/해제
CREATE OR REPLACE FUNCTION admin_toggle_admin(p_user_id UUID, p_grant BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 본인 해제 방지
  IF p_user_id = auth.uid() AND p_grant = FALSE THEN
    RAISE EXCEPTION 'Cannot remove own admin';
  END IF;

  IF p_grant THEN
    INSERT INTO admins (user_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM admins WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- 5. admin_delete_user(p_user_id): 회원 삭제 (auth.users 삭제로 CASCADE)
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 본인 삭제 방지
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete self';
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

-- 6. admin_toggle_draw_active(p_draw_id, p_is_active): 럭드 활성/비활성 토글
CREATE OR REPLACE FUNCTION admin_toggle_draw_active(p_draw_id UUID, p_is_active BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE lucky_draws SET is_active = p_is_active, updated_at = NOW() WHERE id = p_draw_id;
END;
$$;

-- 7. admin_delete_draw(p_draw_id): 럭드 삭제 (draw_items CASCADE)
CREATE OR REPLACE FUNCTION admin_delete_draw(p_draw_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM lucky_draws WHERE id = p_draw_id;
END;
$$;
