-- reviews: one row per completed scan. Hero table for the app.
-- Owned by user: RLS restricts all access to auth.uid() = user_id.

create type public.review_context as enum ('store', 'online', 'home');
create type public.review_verdict as enum ('pass', 'conditional', 'no');
create type public.safety_flag as enum ('no_item', 'person_only', 'inappropriate', 'refused');

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_storage_path text,
  photo_deleted_at timestamptz,
  context public.review_context not null,
  item_name text,
  brand_guess text,
  price_estimate text,
  verdict public.review_verdict not null,
  score numeric(3,1) not null check (score >= 0 and score <= 10),
  sections jsonb not null,
  stylist_voice_id_used uuid,
  model_used text not null,
  ai_cost_cents int not null default 0,
  prompt_version text not null,
  safety_flag public.safety_flag,
  is_favorited boolean not null default false,
  shared_at timestamptz,
  created_at timestamptz not null default now()
);

create index reviews_user_id_created_at_idx on public.reviews (user_id, created_at desc);

comment on table public.reviews is 'One row per completed scan. photo_storage_path is nullified at 24h TTL.';
comment on column public.reviews.sections is 'JSONB of the 11 review sections. fit_for_you omitted when profile empty.';
comment on column public.reviews.prompt_version is 'e.g. "parisian_v3". Used for A/B testing and regression tracking.';

alter table public.reviews enable row level security;

create policy "reviews_select_own" on public.reviews for select
  using (auth.uid() = user_id);

create policy "reviews_insert_own" on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "reviews_update_own" on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "reviews_delete_own" on public.reviews for delete
  using (auth.uid() = user_id);
