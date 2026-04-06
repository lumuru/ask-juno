create table public.stylist_voices (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  prompt_system text not null,
  prompt_user_template text not null,
  ui_theme jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  is_premium boolean not null default false,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

create unique index stylist_voices_single_default_idx
  on public.stylist_voices (is_default)
  where is_default = true;

comment on table public.stylist_voices is 'Voice personas with versioned prompts. Service-role writes only.';

alter table public.stylist_voices enable row level security;

create policy "stylist_voices_read_all" on public.stylist_voices for select
  to authenticated
  using (true);
