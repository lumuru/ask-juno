create type public.device_platform as enum ('ios', 'android');

create table public.device_tokens (
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform public.device_platform not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table public.device_tokens enable row level security;

create policy "device_tokens_select_own" on public.device_tokens for select
  using (auth.uid() = user_id);

create policy "device_tokens_insert_own" on public.device_tokens for insert
  with check (auth.uid() = user_id);

create policy "device_tokens_update_own" on public.device_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "device_tokens_delete_own" on public.device_tokens for delete
  using (auth.uid() = user_id);
