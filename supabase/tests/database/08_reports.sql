BEGIN;
SELECT plan(5);

SELECT has_table('public', 'reports', 'reports table exists');
SELECT has_column('public', 'reports', 'reason', 'has reason');
SELECT has_column('public', 'reports', 'note', 'has note');
SELECT has_column('public', 'reports', 'resolved_at', 'has resolved_at');

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.reports'::regclass),
  true,
  'RLS is enabled on reports'
);

SELECT * FROM finish();
ROLLBACK;
