BEGIN;
SELECT plan(4);

SELECT has_table('public', 'device_tokens', 'device_tokens table exists');
SELECT has_column('public', 'device_tokens', 'token', 'has token');
SELECT has_column('public', 'device_tokens', 'platform', 'has platform');

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.device_tokens'::regclass),
  true,
  'RLS is enabled on device_tokens'
);

SELECT * FROM finish();
ROLLBACK;
