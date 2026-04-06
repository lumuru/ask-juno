create type public.subscription_status as enum (
  'free', 'trial', 'active', 'expired', 'cancelled'
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  revenuecat_customer_id text,
  status public.subscription_status not null default 'free',
  product_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  will_renew boolean not null default false,
  app_version_at_purchase text,
  last_synced_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

comment on table public.subscriptions is 'Mirrors RevenueCat. RevenueCat is the source of truth on conflicts.';

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions for select
  using (auth.uid() = user_id);
