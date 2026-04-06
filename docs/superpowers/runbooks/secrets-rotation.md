# Secrets Rotation Runbook

## Inventory

| Secret | Where used | Where stored |
|---|---|---|
| Supabase `service_role` key | CI, edge functions | Supabase dashboard / Vault |
| Anthropic API key | Edge functions | Supabase Vault |
| RevenueCat webhook secret | `/webhook/revenuecat` | Supabase Vault |
| Apple Sign In secret | Supabase auth config | Supabase dashboard |
| Google OAuth secret | Supabase auth config | Supabase dashboard |

## Rotating Supabase service_role key

1. Dashboard > Settings > API > Regenerate.
2. Update all consumers (edge functions, CI).
3. Verify with smoke script.

## Rotating Anthropic API key

1. https://console.anthropic.com/ > API Keys > Create Key.
2. Store in Supabase Vault as `anthropic_api_key`.
3. Redeploy edge functions.
4. Delete old key.

## If a key is leaked

1. Rotate immediately.
2. Check audit logs for unauthorized use.
3. File incident note.

## Rotation log

| Date | Secret | Rotated by | Reason |
|---|---|---|---|
| _(first rotation will be logged here)_ | | | |
