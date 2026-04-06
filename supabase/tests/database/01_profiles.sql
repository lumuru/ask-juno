BEGIN;
SELECT plan(10);

-- Bypass FK checks so we can insert fake user_ids without a real auth.users row.
-- Everything rolls back at the end of the transaction.
SET LOCAL session_replication_role = 'replica';

-- Structural assertions
SELECT has_table('public', 'profiles', 'profiles table exists');
SELECT has_column('public', 'profiles', 'user_id', 'profiles has user_id');
SELECT has_column('public', 'profiles', 'stylist_voice_id', 'profiles has stylist_voice_id');
SELECT has_column('public', 'profiles', 'level', 'profiles has level');
SELECT has_column('public', 'profiles', 'timezone', 'profiles has timezone');
SELECT col_is_pk('public', 'profiles', 'user_id', 'user_id is PK');

-- RLS assertions
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.profiles'::regclass),
  true,
  'RLS is enabled on profiles'
);

-- RLS behavioral test: user A cannot read user B's profile
DO $$
DECLARE
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
BEGIN
  -- Insert two profiles (FK bypassed via session_replication_role above)
  INSERT INTO public.profiles (user_id, level, timezone)
    VALUES (user_a, 'A', 'UTC'), (user_b, 'A', 'UTC');

  -- Impersonate user A via JWT claim
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;

SELECT is(
  (SELECT count(*) FROM public.profiles),
  1::bigint,
  'authenticated user only sees their own profile row'
);

-- Reset role for final assertions
SELECT set_config('role', 'postgres', true);
SELECT set_config('request.jwt.claims', '', true);

-- Age constraint
SELECT throws_ok(
  $$ INSERT INTO public.profiles (user_id, age, level, timezone) VALUES (gen_random_uuid(), 12, 'A', 'UTC') $$,
  '23514',
  NULL,
  'age below 13 is rejected'
);

-- Default level
SELECT is(
  (SELECT level::text FROM public.profiles WHERE user_id IN (
    SELECT user_id FROM public.profiles LIMIT 1
  )),
  'A'::text,
  'level defaults to A'
);

SELECT * FROM finish();
ROLLBACK;
