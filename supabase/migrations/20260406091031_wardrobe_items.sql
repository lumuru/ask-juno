-- wardrobe_items: persistent closet data for Level C users.
-- Owned by user: RLS restricts all access to auth.uid() = user_id.

create type public.wardrobe_category as enum (
  'top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'bag', 'other'
);

create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_storage_path text,
  item_name text not null,
  category public.wardrobe_category not null,
  color_tags text[] not null default '{}',
  fabric_guess text,
  brand_guess text,
  tags text[] not null default '{}',
  last_worn_with uuid[] not null default '{}',
  original_review_id uuid references public.reviews(id) on delete set null,
  added_at timestamptz not null default now(),
  retired_at timestamptz
);

create index wardrobe_items_user_id_added_at_idx on public.wardrobe_items (user_id, added_at desc);

comment on table public.wardrobe_items is 'Persistent user closet items. Photos live in wardrobe-photos bucket.';

alter table public.wardrobe_items enable row level security;

create policy "wardrobe_items_select_own" on public.wardrobe_items for select
  using (auth.uid() = user_id);

create policy "wardrobe_items_insert_own" on public.wardrobe_items for insert
  with check (auth.uid() = user_id);

create policy "wardrobe_items_update_own" on public.wardrobe_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "wardrobe_items_delete_own" on public.wardrobe_items for delete
  using (auth.uid() = user_id);
