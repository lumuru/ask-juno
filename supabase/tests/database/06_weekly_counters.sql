BEGIN;
SELECT plan(5);

SELECT has_table('public', 'weekly_counters', 'weekly_counters table exists');
SELECT has_column('public', 'weekly_counters', 'week_start', 'has week_start');
SELECT has_column('public', 'weekly_counters', 'review_count', 'has review_count');
SELECT col_is_pk('public', 'weekly_counters', ARRAY['user_id','week_start'], 'composite PK (user_id, week_start)');

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.weekly_counters'::regclass),
  true,
  'RLS is enabled on weekly_counters'
);

SELECT * FROM finish();
ROLLBACK;
