BEGIN;
SELECT plan(5);

SELECT has_table('public', 'share_cards', 'share_cards table exists');
SELECT has_column('public', 'share_cards', 'review_id', 'has review_id');
SELECT has_column('public', 'share_cards', 'is_watermarked', 'has is_watermarked');
SELECT has_column('public', 'share_cards', 'expires_at', 'has expires_at');

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.share_cards'::regclass),
  true,
  'RLS is enabled on share_cards'
);

SELECT * FROM finish();
ROLLBACK;
