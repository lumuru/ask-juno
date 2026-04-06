BEGIN;
SELECT plan(5);

SELECT has_table('public', 'subscriptions', 'subscriptions table exists');
SELECT has_column('public', 'subscriptions', 'revenuecat_customer_id', 'has revenuecat_customer_id');
SELECT has_column('public', 'subscriptions', 'status', 'has status');
SELECT has_column('public', 'subscriptions', 'app_version_at_purchase', 'has app_version_at_purchase');

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.subscriptions'::regclass),
  true,
  'RLS is enabled on subscriptions'
);

SELECT * FROM finish();
ROLLBACK;
