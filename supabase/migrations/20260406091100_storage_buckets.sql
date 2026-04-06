-- Storage buckets for Juno.
-- All buckets are private. Access is mediated by signed URLs from edge functions.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('scan-photos', 'scan-photos', false, 10485760, array['image/jpeg','image/png','image/heic','image/heif']),
  ('wardrobe-photos', 'wardrobe-photos', false, 10485760, array['image/jpeg','image/png','image/heic','image/heif']),
  ('share-cards', 'share-cards', false, 5242880, array['image/png','image/jpeg'])
on conflict (id) do nothing;

-- Access policies: users can only read/write objects under a path prefixed with their user id.
-- Path convention: <user_id>/<filename>

create policy "scan_photos_user_rw"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'scan-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'scan-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "wardrobe_photos_user_rw"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'wardrobe-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'wardrobe-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "share_cards_user_rw"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'share-cards' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'share-cards' and auth.uid()::text = (storage.foldername(name))[1]);
