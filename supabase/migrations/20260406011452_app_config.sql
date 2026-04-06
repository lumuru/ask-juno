create table public.app_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by text,
  updated_at timestamptz not null default now()
);

comment on table public.app_config is 'Server-tunable knobs: caps, model IDs, prompt versions, feature flags, kill switch.';

alter table public.app_config enable row level security;

create policy "app_config_read_all" on public.app_config for select
  to authenticated
  using (true);
