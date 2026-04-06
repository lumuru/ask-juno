create table public.weekly_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  review_count int not null default 0 check (review_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

create index weekly_counters_week_start_idx on public.weekly_counters (week_start);

comment on table public.weekly_counters is 'Free-tier weekly review cap. week_start = Monday in user TZ, stored as UTC date.';

alter table public.weekly_counters enable row level security;

create policy "weekly_counters_select_own" on public.weekly_counters for select
  using (auth.uid() = user_id);
