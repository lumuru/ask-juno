BEGIN;
SELECT plan(6);

SELECT has_table('public', 'stylist_voices', 'stylist_voices table exists');
SELECT has_column('public', 'stylist_voices', 'slug', 'has slug');
SELECT has_column('public', 'stylist_voices', 'prompt_system', 'has prompt_system');
SELECT has_column('public', 'stylist_voices', 'version', 'has version');

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.stylist_voices'::regclass),
  true,
  'RLS is enabled on stylist_voices'
);

-- Authenticated users can SELECT but not INSERT
DO $$
DECLARE
  u uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.stylist_voices (slug, name, description, prompt_system, prompt_user_template)
    VALUES ('test', 'Test', 'desc', 'sys', 'user');
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;

SELECT throws_ok(
  $$ INSERT INTO public.stylist_voices (slug, name, description, prompt_system, prompt_user_template) VALUES ('x','x','x','x','x') $$,
  '42501',
  NULL,
  'authenticated user cannot insert into stylist_voices'
);

SELECT * FROM finish();
ROLLBACK;
