# 럭키드로우메이커 (Luckydraw Maker)

아이돌 이벤트 카페를 위한 온라인 럭키드로우(뽑기) 서비스.
카페 운영자가 뽑기 이벤트를 생성하고, 참여자가 URL로 접속하여 실시간 뽑기에 참여할 수 있다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) + React 19 + TypeScript |
| 스타일링 | Tailwind CSS 4 + CSS 변수 기반 테마 시스템 |
| 인증/DB/스토리지 | Supabase (Google OAuth, PostgreSQL, RLS, Realtime, Storage) |
| 상태관리 | Zustand (drawStore, themeStore, uiStore, adminFeedbackStore) |
| UI 컴포넌트 | Radix UI (Dialog, Select, Slider, Switch, Toast) |
| 애니메이션 | Framer Motion |
| 아이콘 | Lucide React |
| 폼 | React Hook Form + Zod 검증 |
| 이메일 | Resend (피드백 전송) |
| 마크다운 | @uiw/react-md-editor (편집), react-markdown (렌더링) |
| 이미지 | browser-image-compression + WebP 변환 |
| 날짜 | date-fns |
| 패키지 매니저 | npm |

---

## 시작하기

### 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend) — 피드백 기능용
RESEND_API_KEY=re_xxxxxxxxxx        # re_xxxx로 설정하면 이메일 전송 비활성화
FEEDBACK_TO_EMAIL=admin@example.com  # 서버 전용, NEXT_PUBLIC_ 접두사 금지
FEEDBACK_FROM_EMAIL=noreply@example.com
```

### 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 프로덕션 빌드
npm run lint       # ESLint 검사
```

---

## 디렉토리 구조

```
src/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (테마, 배경효과, 토스트)
│   ├── globals.css                   # 디자인 토큰, 테마, 커스텀 클래스
│   ├── page.tsx                      # 랜딩 페이지
│   ├── middleware.ts                 # 인증/관리자 라우트 가드
│   ├── auth/callback/route.ts        # Google OAuth 콜백
│   ├── vault/                        # 내 뽑기 보관함
│   ├── create/                       # 뽑기 생성
│   ├── edit/[id]/                    # 뽑기 수정
│   ├── draw/[id]/                    # 운영자 뽑기 실행 화면
│   ├── play/[id]/                    # 참여자 뽑기 화면 (비로그인 접근 가능)
│   ├── announcements/                # 공지사항 목록/상세
│   ├── admin/                        # 관리자 대시보드 (URL 직접 접근만 가능)
│   │   ├── draws/                    # 전체 뽑기 관리
│   │   ├── users/                    # 사용자 관리
│   │   ├── feedbacks/                # 피드백 관리
│   │   └── announcements/[id]/       # 공지 작성/수정 에디터
│   └── api/
│       ├── feedback/route.ts         # POST: 피드백 전송
│       └── draw/[id]/pick/route.ts   # POST: 뽑기 실행 (공개 API)
├── components/
│   ├── ui/                           # 공통 UI (Button, GlassCard, Badge, Toast 등)
│   ├── domain/                       # 도메인 컴포넌트 (DrawScreen, LuckyDrawEditor 등)
│   ├── layout/                       # Header, HamburgerMenu, AdminNav, ThemeSelector
│   └── providers/                    # ThemeProvider
├── hooks/                            # 커스텀 훅 (useAuth, useLuckyDraws, useAnnouncements 등)
├── lib/                              # 유틸리티 (lottery, imageUtils, rateLimit, announcements)
│   └── supabase/                     # Supabase 클라이언트 (client.ts, server.ts)
├── stores/                           # Zustand 스토어
├── contexts/                         # AdminContext
└── types/index.ts                    # 전체 타입 정의
supabase/
├── schema.sql                        # 전체 DB 스키마
└── migrations/                       # 마이그레이션 파일들
```

---

## 라우팅 & 접근 권한

| 경로 | 접근 | 설명 |
|------|------|------|
| `/` | 공개 | 랜딩 (Google 로그인) |
| `/vault` | 인증 | 내 뽑기 보관함 |
| `/vault/[id]` | 인증 | 뽑기 상세/관리 |
| `/create` | 인증 | 뽑기 생성 |
| `/edit/[id]` | 인증 | 뽑기 수정 |
| `/draw/[id]` | 인증 | 운영자 실시간 뽑기 대시보드 |
| `/draw/[id]/info` | 인증 | 뽑기 정보/설정 |
| `/play/[id]` | **공개** | 참여자 뽑기 화면 (비로그인 가능) |
| `/announcements` | 인증 | 공지사항 목록 |
| `/announcements/[id]` | 인증 | 공지 상세 |
| `/admin/*` | **관리자** | 관리자 대시보드 (미들웨어 + 페이지 이중 검증) |
| `POST /api/draw/[id]/pick` | **공개** | 뽑기 API (IP 기반 rate limit) |
| `POST /api/feedback` | 인증 | 피드백 전송 API |

### 미들웨어 로직 (`src/middleware.ts`)

- Supabase SSR 서버 클라이언트로 JWT 검증 (`getUser()`)
- `/play/*`, `/api/draw/[uuid]/pick`은 인증 없이 통과
- `/admin/*`은 `supabase.rpc('is_admin')` 추가 검증, 실패 시 `/vault?error=unauthorized` 리다이렉트
- 비인증 사용자는 `/`로 리다이렉트

---

## 핵심 도메인 모델

### 타입 (`src/types/index.ts`)

```typescript
type ProbabilityMode = 'equal' | 'weighted';

interface LuckyDraw {
  id, userId, name, drawButtonLabel, probabilityMode,
  isActive, ticketOptions: number[], createdAt, updatedAt, items?: DrawItem[]
}

interface DrawItem {
  id, drawId, name, quantity, remaining, imageUrl, sortOrder
}

interface DrawResult { item: DrawItem; isNew: boolean }

interface DrawResultLog {
  id, drawId, itemId, itemName, itemImage, ticketsUsed, createdAt
}

interface Announcement {
  id, title, content, isPinned, isPublished, createdAt, updatedAt, authorId
}

interface AnnouncementWithReadStatus extends Announcement { isRead: boolean }

type FeedbackCategory = 'bug' | 'feature' | 'general' | 'other';

interface Feedback {
  id, userId, senderEmail, subject, message, category, isRead, createdAt
}

interface AdminUser {
  id, email, displayName, avatarUrl, createdAt, isAdmin, drawCount
}

interface AdminDraw {
  id, userId, name, drawButtonLabel, probabilityMode, isActive,
  createdAt, updatedAt, ownerDisplayName, ownerEmail, ownerAvatarUrl,
  itemCount, totalQuantity, totalRemaining
}
```

---

## 데이터베이스 스키마

전체 스키마: `supabase/schema.sql`

### 테이블

| 테이블 | 설명 |
|--------|------|
| `profiles` | 사용자 프로필 (auth.users 확장) |
| `lucky_draws` | 뽑기 이벤트 |
| `draw_items` | 뽑기 상품 (수량, 잔여, 이미지) |
| `draw_results` | 당첨 로그 (감사 추적) |
| `announcements` | 공지사항 (마크다운, 고정/발행) |
| `announcement_reads` | 사용자별 공지 읽음 추적 |
| `admins` | 관리자 역할 (수동 INSERT) |
| `feedbacks` | 사용자 피드백 |

### 주요 RPC 함수

| 함수 | 설명 |
|------|------|
| `decrement_item_quantity(p_item_id)` | 상품 잔여 수량 -1 (SECURITY DEFINER) |
| `is_admin()` | 현재 사용자 관리자 여부 확인 |
| `get_admin_draws()` | 전체 뽑기 목록 + 소유자/통계 정보 |
| `get_admin_users()` | 전체 사용자 목록 + 관리자 여부/뽑기 수 |
| `admin_toggle_admin(p_user_id, p_grant)` | 관리자 권한 부여/해제 |
| `admin_delete_user(p_user_id)` | 사용자 삭제 (자기 자신 보호) |
| `admin_toggle_draw_active(p_draw_id, p_is_active)` | 뽑기 활성화 토글 |
| `admin_get_draw_detail(p_draw_id)` | 뽑기 상세 (draw, items, owner) |

### RLS 정책 요약

- **profiles**: 자기 자신만 읽기/수정
- **lucky_draws**: 소유자 전체 CRUD, 인증 사용자 읽기 가능 (play 경로용)
- **draw_items**: 소유자 CRUD, 인증 사용자 읽기
- **announcements**: 발행된 공지만 공개 읽기, 관리자 전체 CRUD
- **feedbacks**: 인증 사용자 INSERT, 관리자 SELECT/UPDATE
- **Storage (draw-images)**: 업로드/수정/삭제는 본인 폴더만, 읽기는 공개

---

## 상태 관리 (Zustand)

| 스토어 | 위치 | 설명 | 영속성 |
|--------|------|------|--------|
| `drawStore` | `src/stores/drawStore.ts` | 활성 뽑기 상태, 결과, 진행 중 플래그 | 없음 |
| `themeStore` | `src/stores/themeStore.ts` | 현재 테마 ID (`dark-glass`, `retro-pc`) | localStorage (`luckydraw-theme`) |
| `uiStore` | `src/stores/uiStore.ts` | 토스트 알림 관리 | 없음 |
| `adminFeedbackStore` | `src/stores/adminFeedbackStore.ts` | 읽지 않은 피드백 수 | 없음 |

---

## 커스텀 훅

| 훅 | 설명 |
|----|------|
| `useAuth()` | 인증 상태, Google 로그인/로그아웃 |
| `useLuckyDraws(userId?)` | 사용자 뽑기 목록 + 삭제 |
| `useLuckyDraw(id, requireOwnership?, enableRealtime?)` | 단일 뽑기 + Realtime 잔여 수량 업데이트 |
| `useDrawResults({ drawId, enabled? })` | 당첨 로그 + Realtime INSERT 구독 |
| `useAnnouncements()` | 공지 목록 + 읽음 처리 + Realtime 구독 |
| `useIsAdmin()` | 관리자 여부 캐싱 |
| `useAdminDraws()` | 관리자: 전체 뽑기 + 토글/삭제 |
| `useAdminDrawDetail(drawId)` | 관리자: 뽑기 상세 |
| `useAdminFeedbacks()` | 관리자: 피드백 목록 + 읽음 처리 |
| `useAdminUsers()` | 관리자: 사용자 목록 + 권한/삭제 |

---

## 디자인 시스템

### 테마

3가지 테마를 지원하며, `data-theme` HTML 속성으로 전환:

| 테마 ID | 이름 | 설명 |
|---------|------|------|
| `dark-glass` | 기본 | 네오브루탈 감성 (기본값) |
| `retro-pc` | PC통신 | 하이텔 BBS 스타일 |

### 색상 토큰 (CSS 변수)

디자인 토큰은 `src/app/globals.css`의 `@theme` 블록에 정의.

**주요 색상:**
- `--color-gum-pink`, `--color-gum-hotpink`, `--color-gum-yellow`, `--color-gum-green`
- `--color-gum-blue`, `--color-gum-purple`, `--color-gum-coral`, `--color-gum-orange`
- `--color-gum-mint`, `--color-gum-cream`, `--color-gum-black`, `--color-gum-dark`

**시맨틱 색상:**
- `--color-accent-primary`, `--color-accent-secondary`, `--color-accent-tertiary`
- `--color-success`, `--color-warning`, `--color-error`
- `--color-bg-base`, `--color-bg-elevated`, `--color-bg-card`
- `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`

**테마 프리픽스 (Tailwind에서 사용):**
- `--color-theme-bg`, `--color-theme-card`, `--color-theme-elevated`
- `--color-theme-text`, `--color-theme-text-sub`, `--color-theme-accent`
- `--color-theme-border`

### 폰트

| 변수 | 폰트 | 용도 |
|------|-------|------|
| `--font-display` | Bagel Fat One | 제목/타이틀 |
| `--font-body` | Gothic A1 | 본문 |
| `--font-mono` | DM Mono | 코드/숫자 |
| `--font-retro` | DungGeunMo | PC통신 테마 전용 |

### 그림자 & 효과

- `--shadow-brutal`: 네오브루탈 스타일 (`4px 4px 0px`)
- `--shadow-brutal-lg`, `--shadow-brutal-sm`: 크기 변형
- `--shadow-brutal-pink`, `--shadow-brutal-yellow`: 색상 변형
- `--shadow-glow-primary`, `--shadow-glow-secondary`: 글로우 효과
- `--blur-glass`: 글래스모피즘 블러 (`16px`)
- `--radius-card`: 카드 둥글기 (`20px`)

### 커스텀 CSS 클래스

- `.brutal-card`: 3px 실선 테두리 + brutal 그림자
- `.brutal-card-pink`: 핑크 그림자 변형
- `.glass-card`: 글래스모피즘 (블러 배경 + 반투명 테두리)

### 애니메이션 (`@keyframes`)

- `wiggle`: 좌우 흔들림 (-2deg ~ 2deg)
- `bounce-in`: 등장 바운스 (scale 0 → 1)
- `float`: 위아래 부유 (±6px)
- `confetti-fall`: 대각선 낙하 + 회전
- `rainbow-bg`: gum 색상 사이클
- `blink-cursor`: 커서 깜빡임

---

## UI 컴포넌트

### 공통 UI (`src/components/ui/`)

| 컴포넌트 | 설명 |
|----------|------|
| `Button` | 다중 variant 버튼 (Framer Motion, 테마 지원) |
| `GlassCard` | 글래스모피즘 카드 컨테이너 |
| `Badge` | 태그/뱃지 |
| `ImageUpload` | 파일 업로드 + 미리보기 (react-dropzone) |
| `LoadingSpinner` | 로딩 인디케이터 |
| `Toast` / `ToastContainer` | 토스트 알림 시스템 |
| `StarField` | 별 파티클 배경 |
| `CandyParticles` | 캔디 파티클 배경 |
| `BackgroundEffect` | 현재 테마에 맞는 배경 효과 렌더링 |

### 도메인 컴포넌트 (`src/components/domain/`)

| 컴포넌트 | 설명 |
|----------|------|
| `DrawScreen` | 뽑기 애니메이션 화면 (1043줄, 핵심 컴포넌트) |
| `LuckyDrawEditor` | 뽑기 생성/수정 폼 |
| `LuckyDrawCard` | 뽑기 목록 카드 |
| `DrawItemCard` | 상품 카드 (이미지, 수량) |
| `AnnouncementPanel` | 공지 슬라이드 패널 |
| `AnnouncementDetail` | 공지 상세 모달 (마크다운 렌더링) |
| `FeedbackModal` | 피드백 작성 모달 |

---

## API 엔드포인트

### `POST /api/draw/[id]/pick`

뽑기 실행 API. 비인증 접근 가능 (play 경로용).

- **입력**: `{ count?: 1~10 }` (기본값 1)
- **Rate limit**: IP+drawId 기준 30회/분
- **로직**: 확률 모드에 따라 상품 선택 → `decrement_item_quantity` RPC → `draw_results` 기록
- **응답**: `{ success, item, remaining }` (단건) 또는 `{ success, bulk, items[], count }` (복수)
- **에러 코드**: `invalid_id`, `rate_limited` (429), `not_found` (404), `draw_not_active` (403), `exhausted`

### `POST /api/feedback`

피드백 전송 API. 인증 필수.

- **입력**: `{ senderEmail, subject, message, category }`
- **Zod 검증**: email, subject(1~100자), message(10~2000자), category(bug/feature/general/other)
- **Rate limit**: IP 기준 3회/시간
- **동작**: DB 저장 후, Resend API로 이메일 전송 (이메일 실패해도 DB 저장은 유지)

---

## Supabase 연동

### 클라이언트

| 파일 | 용도 |
|------|------|
| `src/lib/supabase/client.ts` | 브라우저 싱글톤 클라이언트 (`createBrowserClient`) |
| `src/lib/supabase/server.ts` | SSR 서버 클라이언트 (`next/headers` 쿠키 기반) |

### Realtime 구독

여러 훅에서 Supabase Realtime을 사용:
- `useLuckyDraw`: `draw_items` UPDATE → 잔여 수량 실시간 반영 + 20% 미만 시 브라우저 알림
- `useDrawResults`: `draw_results` INSERT → 당첨 로그 실시간 추가
- `useAnnouncements`: `announcements` 전체 이벤트 → 목록 자동 갱신

모든 구독은 `useEffect` cleanup에서 `supabase.removeChannel(channel)` 호출.

### 이미지 업로드 (`src/lib/imageUtils.ts`)

- 허용 형식: PNG, JPEG, WebP, GIF
- 최대 파일 크기: 10MB
- 2MB 초과 시 자동 압축 (최대 1.5MB, 800px, WebP 변환)
- 저장 경로: `draw-images/{userId}/{uuid}.webp`

---

## 마이그레이션 이력

| 날짜 | 파일 | 내용 |
|------|------|------|
| 2026-02-28 | `20260228_add_remaining_and_rpc.sql` | 잔여 수량 추적 + decrement RPC |
| 2026-03-01 | `20260301_create_feedbacks.sql` | feedbacks 테이블 생성 |
| 2026-03-01 | `20260301_feedbacks_admin_update.sql` | 관리자 피드백 UPDATE 정책 |
| 2026-03-02 | `20260302_admin_users_draws_management.sql` | 관리자 관리 RPC 추가 |
| 2026-03-08 | `20260308_add_draw_results.sql` | 당첨 로그 테이블 |
| 2026-03-08 | `20260308_add_ticket_options.sql` | 티켓 옵션 기능 |
| 2026-03-08 | `20260308_fix_rls_and_rpc.sql` | RLS/RPC 수정 |

---

## 코딩 컨벤션

### 파일 패턴

- **페이지**: `src/app/[route]/page.tsx` (Server Component) + `[Route]Client.tsx` (Client Component)
- **컴포넌트**: PascalCase 파일명, `export function` 또는 `export default function`
- **훅**: `src/hooks/use[Name].ts`, camelCase
- **유틸리티**: `src/lib/[name].ts`
- **스토어**: `src/stores/[name]Store.ts`

### 스타일 규칙

- 색상은 반드시 CSS 변수/Tailwind 토큰 사용 (하드코딩 금지)
- 공통 컴포넌트(`Button`, `Badge`, `GlassCard`) 재사용 우선
- 새 애니메이션은 `globals.css`의 기존 `@keyframes` 활용
- `cn()` 유틸리티로 조건부 클래스 조합 (`clsx` + `tailwind-merge`)

### 경로 별칭

`@/*` → `./src/*` (tsconfig.json)
