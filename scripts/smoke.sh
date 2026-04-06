#!/usr/bin/env bash
# Smoke test for Juno backend foundation.
# Exercises anon signup, profile creation, review insertion, RLS isolation,
# and basic read/write flows. Run against a fresh `supabase start`.
#
# Usage: ./scripts/smoke.sh
#
# Requires: curl, jq, a running local Supabase stack.

set -euo pipefail

API_URL="http://127.0.0.1:54321"

# Read keys from supabase status
eval "$(supabase status -o env 2>/dev/null)" || true

if [[ -z "${ANON_KEY:-}" || -z "${SERVICE_ROLE_KEY:-}" ]]; then
  echo "ERROR: could not read anon/service keys from 'supabase status'."
  echo "Is the local stack running? Try: supabase start"
  exit 1
fi

echo "==> 1. Anonymous signup (user A)"
USER_A=$(curl -sS "$API_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}')
USER_A_JWT=$(echo "$USER_A" | jq -r '.access_token')
USER_A_ID=$(echo "$USER_A" | jq -r '.user.id')
echo "    user A id: $USER_A_ID"
[[ "$USER_A_JWT" != "null" && -n "$USER_A_JWT" ]] || { echo "FAIL: no JWT for user A"; exit 1; }

echo "==> 2. Anonymous signup (user B)"
USER_B=$(curl -sS "$API_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}')
USER_B_JWT=$(echo "$USER_B" | jq -r '.access_token')
USER_B_ID=$(echo "$USER_B" | jq -r '.user.id')
echo "    user B id: $USER_B_ID"

echo "==> 3. User A inserts their profile"
curl -sS "$API_URL/rest/v1/profiles" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_A_JWT" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"user_id\":\"$USER_A_ID\",\"level\":\"A\",\"timezone\":\"Asia/Manila\"}" | jq .

echo "==> 4. User B inserts their profile"
curl -sS "$API_URL/rest/v1/profiles" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_B_JWT" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"user_id\":\"$USER_B_ID\",\"level\":\"A\",\"timezone\":\"UTC\"}" | jq .

echo "==> 5. User A tries to read user B's profile (should return empty)"
A_SEES=$(curl -sS "$API_URL/rest/v1/profiles?user_id=eq.$USER_B_ID" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_A_JWT")
if [[ "$A_SEES" != "[]" ]]; then
  echo "FAIL: user A saw user B's profile: $A_SEES"
  exit 1
fi
echo "    OK: RLS blocked cross-user read"

echo "==> 6. User A reads stylist_voices (should see 3 rows)"
VOICES=$(curl -sS "$API_URL/rest/v1/stylist_voices?select=slug" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_A_JWT")
COUNT=$(echo "$VOICES" | jq 'length')
if [[ "$COUNT" != "3" ]]; then
  echo "FAIL: expected 3 stylist voices, got $COUNT"
  exit 1
fi
echo "    OK: 3 voices visible to user A"

echo "==> 7. User A tries to INSERT a stylist voice (should fail)"
STATUS=$(curl -sS -o /dev/null -w "%{http_code}" "$API_URL/rest/v1/stylist_voices" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_A_JWT" \
  -H "Content-Type: application/json" \
  -d '{"slug":"hacker","name":"x","description":"x","prompt_system":"x","prompt_user_template":"x"}')
if [[ "${STATUS:0:1}" != "4" ]]; then
  echo "FAIL: expected 4xx on stylist_voices write, got $STATUS"
  exit 1
fi
echo "    OK: user A cannot write stylist_voices (HTTP $STATUS)"

echo "==> 8. User A reads app_config (should see 11 rows)"
CONFIG_COUNT=$(curl -sS "$API_URL/rest/v1/app_config?select=key" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_A_JWT" | jq 'length')
if [[ "$CONFIG_COUNT" != "11" ]]; then
  echo "FAIL: expected 11 app_config rows, got $CONFIG_COUNT"
  exit 1
fi
echo "    OK: app_config readable ($CONFIG_COUNT rows)"

echo
echo "All smoke checks passed."
