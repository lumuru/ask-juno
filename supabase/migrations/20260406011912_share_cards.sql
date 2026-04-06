create table public.share_cards (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text not null,
  is_watermarked boolean not null default true,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create index share_cards_review_id_idx on public.share_cards (review_id);
create index share_cards_expires_at_idx on public.share_cards (expires_at);

alter table public.share_cards enable row level security;

create policy "share_cards_select_own" on public.share_cards for select
  using (auth.uid() = user_id);

create policy "share_cards_insert_own" on public.share_cards for insert
  with check (auth.uid() = user_id);

create policy "share_cards_delete_own" on public.share_cards for delete
  using (auth.uid() = user_id);
