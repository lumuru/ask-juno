create type public.report_reason as enum (
  'inaccurate', 'offensive', 'off_voice', 'wrong_item', 'other'
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  reason public.report_reason not null,
  note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index reports_review_id_idx on public.reports (review_id);
create index reports_unresolved_idx on public.reports (created_at) where resolved_at is null;

alter table public.reports enable row level security;

create policy "reports_select_own" on public.reports for select
  using (auth.uid() = user_id);

create policy "reports_insert_own" on public.reports for insert
  with check (auth.uid() = user_id);
