# Supabase Deployment Runbook

## Overview

Juno runs two hosted Supabase projects:
- **Staging** — `juno-staging` in `ap-southeast-1` (Singapore)
- **Production** — `juno-prod` in `ap-southeast-1` (Singapore)

Migrations are applied to staging first, verified, then promoted to prod manually.

## One-time setup (user-performed)

1. Sign in at https://supabase.com.
2. Create project `juno-staging`, region **Singapore (ap-southeast-1)**, strong DB password.
3. Create project `juno-prod`, same region, separate strong password.
4. For each project, go to **Settings > API** and copy: Project URL, `anon` public key, `service_role` secret key.
5. Go to **Authentication > Providers** and enable **Anonymous sign-ins**.

## Linking local CLI to hosted projects

```bash
supabase login
supabase link --project-ref <staging-project-ref>
```

## Applying migrations to staging

```bash
supabase link --project-ref <staging-project-ref>
supabase db push
```

## Promoting to production

1. Verify staging is healthy.
2. `supabase link --project-ref <prod-project-ref>`
3. `supabase db push`
4. Tag: `git tag -a db-$(date +%Y%m%d) -m "DB migration to prod"`

## Rollback

Supabase migrations are forward-only. Write a new migration to reverse changes.
