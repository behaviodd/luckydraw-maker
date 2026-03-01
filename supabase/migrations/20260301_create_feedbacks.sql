-- 피드백 테이블
create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  sender_email text not null,
  subject text not null,
  message text not null,
  category text not null check (category in ('bug', 'feature', 'general', 'other')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.feedbacks enable row level security;

-- 인증된 사용자는 자신의 피드백만 삽입 가능
create policy "Users can insert own feedback"
  on public.feedbacks for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 관리자는 모든 피드백 조회 가능
create policy "Admins can view all feedback"
  on public.feedbacks for select
  to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()));
