BEGIN;
SELECT plan(9);

-- Bypass FK checks so we can insert fake user_ids without real auth.users rows.
SET LOCAL session_replication_role = 'replica';

SELECT has_table('public', 'reviews', 'reviews table exists');
SELECT has_column('public', 'reviews', 'sections', 'reviews has sections jsonb');
SELECT has_column('public', 'reviews', 'verdict', 'reviews has verdict');
SELECT has_column('public', 'reviews', 'score', 'reviews has score');
SELECT has_column('public', 'reviews', 'prompt_version', 'reviews has prompt_version');
SELECT has_column('public', 'reviews', 'model_used', 'reviews has model_used');
SELECT has_column('public', 'reviews', 'ai_cost_cents', 'reviews has ai_cost_cents');

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.reviews'::regclass),
  true,
  'RLS is enabled on reviews'
);

-- RLS behavioral test: user A cannot see user B's reviews
DO $$
DECLARE
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.reviews (user_id, context, verdict, score, sections, prompt_version, model_used)
    VALUES
      (user_a, 'store', 'pass', 8.0, '{"first_impression":"ok"}'::jsonb, 'v0', 'test'),
      (user_b, 'store', 'pass', 7.0, '{"first_impression":"ok"}'::jsonb, 'v0', 'test');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;

SELECT is(
  (SELECT count(*) FROM public.reviews),
  1::bigint,
  'authenticated user only sees their own reviews'
);

SELECT * FROM finish();
ROLLBACK;
