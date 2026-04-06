BEGIN;
SELECT plan(6);

-- Bypass FK checks so we can insert fake user_ids without real auth.users rows.
SET LOCAL session_replication_role = 'replica';

SELECT has_table('public', 'wardrobe_items', 'wardrobe_items table exists');
SELECT has_column('public', 'wardrobe_items', 'photo_storage_path', 'has photo_storage_path');
SELECT has_column('public', 'wardrobe_items', 'color_tags', 'has color_tags');
SELECT has_column('public', 'wardrobe_items', 'retired_at', 'has retired_at');

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.wardrobe_items'::regclass),
  true,
  'RLS is enabled on wardrobe_items'
);

-- RLS behavioral test
DO $$
DECLARE
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.wardrobe_items (user_id, item_name, category)
    VALUES (user_a, 'black tee', 'top'), (user_b, 'blue jeans', 'bottom');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;

SELECT is(
  (SELECT count(*) FROM public.wardrobe_items),
  1::bigint,
  'authenticated user only sees their own wardrobe'
);

SELECT * FROM finish();
ROLLBACK;
