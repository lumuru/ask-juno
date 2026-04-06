-- profiles: 1:1 with auth.users. Holds progressive profile data and timezone.
-- Owned by user: RLS restricts all access to auth.uid() = user_id.

create type public.profile_level as enum ('A', 'B', 'C');
create type public.gender_presentation as enum ('masc', 'femme', 'androgynous', 'other', 'prefer_not_to_say');
create type public.budget_tier as enum ('low', 'mid', 'high');
create type public.color_undertone as enum ('cool', 'warm', 'neutral');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  stylist_voice_id uuid,
  level public.profile_level not null default 'A',
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  size_top text,
  size_bottom text,
  shoe_size text,
  age int check (age is null or age >= 13),
  gender_presentation public.gender_presentation,
  budget_tier public.budget_tier,
  color_undertone public.color_undertone,
  body_shape text,
  occasion_tags text[] not null default '{}',
  style_vetoes text[] not null default '{}',
  style_quiz_completed_at timestamptz,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth user. Progressive profile data for stylist personalization.';
comment on column public.profiles.age is 'Self-attested. Must be >=13 (COPPA gate).';
comment on column public.profiles.timezone is 'IANA zone, used to compute weekly cap reset in user-local time.';

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = user_id);
