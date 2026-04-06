create type public.unlock_feature as enum (
  'style_quiz', 'wardrobe', 'voice_swap_hint'
);

create table public.unlock_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature public.unlock_feature not null,
  earned_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, feature)
);

alter table public.unlock_events enable row level security;

create policy "unlock_events_select_own" on public.unlock_events for select
  using (auth.uid() = user_id);

create policy "unlock_events_update_own" on public.unlock_events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
