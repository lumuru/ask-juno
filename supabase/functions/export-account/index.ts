// supabase/functions/export-account/index.ts

import { corsResponse, jsonResponse } from "../_shared/cors.ts";
import { badRequest, unauthorized } from "../_shared/errors.ts";
import { authenticateRequest } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "GET") return badRequest("GET only");

  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();
  const { userId, userClient } = auth;

  // Query all user data in parallel (RLS scopes to user automatically)
  const [
    profileResult,
    reviewsResult,
    wardrobeResult,
    reportsResult,
    unlockResult,
    shareCardsResult,
    deviceTokensResult,
  ] = await Promise.all([
    userClient.from("profiles").select("*").eq("user_id", userId).single(),
    userClient
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    userClient
      .from("wardrobe_items")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false }),
    userClient
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    userClient.from("unlock_events").select("*").eq("user_id", userId),
    userClient
      .from("share_cards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    userClient.from("device_tokens").select("*").eq("user_id", userId),
  ]);

  // Subscription data (user can read their own via RLS)
  const subscriptionResult = await userClient
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // Weekly counters (user can read their own via RLS)
  const countersResult = await userClient
    .from("weekly_counters")
    .select("*")
    .eq("user_id", userId)
    .order("week_start", { ascending: false });

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: userId,
    profile: profileResult.data ?? null,
    subscription: subscriptionResult.data ?? null,
    reviews: reviewsResult.data ?? [],
    wardrobe_items: wardrobeResult.data ?? [],
    reports: reportsResult.data ?? [],
    unlock_events: unlockResult.data ?? [],
    share_cards: shareCardsResult.data ?? [],
    device_tokens: deviceTokensResult.data ?? [],
    weekly_counters: countersResult.data ?? [],
  };

  return jsonResponse(exportData);
});
