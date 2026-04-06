BEGIN;
SELECT plan(4);

SELECT has_table('public', 'app_config', 'app_config table exists');
SELECT has_column('public', 'app_config', 'key', 'has key');
SELECT has_column('public', 'app_config', 'value', 'has value jsonb');

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.app_config'::regclass),
  true,
  'RLS is enabled on app_config'
);

SELECT * FROM finish();
ROLLBACK;
