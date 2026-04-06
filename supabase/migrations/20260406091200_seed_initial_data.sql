-- Seed v0 defaults. Prompts are intentionally stub-quality;
-- real prompt engineering happens in the edge-functions plan.

insert into public.stylist_voices (slug, name, description, prompt_system, prompt_user_template, is_default, version)
values
  (
    'parisian_editor',
    'Parisian Editor',
    'Dry, precise, a little cutting. Never cruel.',
    'You are a Parisian fashion editor. Dry, precise, never cruel. Return only valid JSON matching the schema provided in the user message. [STUB v0 — replaced in edge-functions plan]',
    'Review this item in the Parisian Editor voice. Profile: {{profile}}. Context: {{context}}.',
    true,
    1
  ),
  (
    'sassy_best_friend',
    'Sassy Best Friend',
    'Warm, funny, honest, occasionally dramatic.',
    'You are a warm, funny best friend giving honest style advice. Return only valid JSON. [STUB v0]',
    'Review this item in the Sassy Best Friend voice. Profile: {{profile}}. Context: {{context}}.',
    false,
    1
  ),
  (
    'runway_critic',
    'Runway Critic',
    'Technical, reference-heavy, high standards.',
    'You are a technical runway critic. Reference fashion history when relevant. Return only valid JSON. [STUB v0]',
    'Review this item in the Runway Critic voice. Profile: {{profile}}. Context: {{context}}.',
    false,
    1
  )
on conflict (slug) do nothing;

insert into public.app_config (key, value, description) values
  ('free_tier_reviews_per_week',     '5'::jsonb,                                   'Free-tier weekly review cap'),
  ('paid_daily_cap',                  '50'::jsonb,                                  'Paid-tier daily review cap (abuse prevention)'),
  ('claude_model_free',               '"claude-haiku-4-5-20251001"'::jsonb,         'Model used for free tier'),
  ('claude_model_paid',               '"claude-sonnet-4-6"'::jsonb,                 'Model used for paid tier'),
  ('prompt_version_active',           '"v0"'::jsonb,                                'Current production prompt version'),
  ('review_schema_version',           '1'::jsonb,                                   'Output schema version'),
  ('daily_cost_cap_cents',            '10000'::jsonb,                               'Circuit breaker: pause free tier if breached'),
  ('min_supported_client_version',    '"0.1.0"'::jsonb,                             'Clients below this get forced-update screen'),
  ('force_model_for_all',             'null'::jsonb,                                'Override model selection for all users; null = use tier routing'),
  ('feature_flags',                   '{}'::jsonb,                                  'PostHog-read feature flags mirrored here'),
  ('default_voice',                   '"parisian_editor"'::jsonb,                   'Fallback voice if user hasn''t chosen')
on conflict (key) do nothing;
