BEGIN;
SELECT plan(4);

SELECT has_table('public', 'unlock_events', 'unlock_events table exists');
SELECT has_column('public', 'unlock_events', 'feature', 'has feature');
SELECT has_column('public', 'unlock_events', 'earned_at', 'has earned_at');

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.unlock_events'::regclass),
  true,
  'RLS is enabled on unlock_events'
);

SELECT * FROM finish();
ROLLBACK;
