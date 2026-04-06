// supabase/functions/unlock-check/index.ts

import { corsResponse, jsonResponse } from "../_shared/cors.ts";
import { unauthorized } from "../_shared/errors.ts";
import { authenticateRequest } from "../_shared/auth.ts";

// Unlock thresholds from design spec
const THRESHOLDS = {
  style_quiz: 3, // after 3 reviews
  wardrobe: 8, // after 8 reviews
  voice_swap_hint: 5, // after 5 reviews in one voice
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();
  const { userId, userClient } = auth;

  // Get total review count and per-voice counts
  const [reviewsResult, existingUnlocks] = await Promise.all([
    userClient
      .from("reviews")
      .select("stylist_voice_id_used", { count: "exact" }),
    userClient
      .from("unlock_events")
      .select("feature, earned_at, completed_at"),
  ]);

  const totalReviews = reviewsResult.count ?? 0;

  // Count reviews per voice
  const voiceCounts = new Map<string, number>();
  for (const row of reviewsResult.data ?? []) {
    const vid = row.stylist_voice_id_used;
    if (vid) voiceCounts.set(vid, (voiceCounts.get(vid) ?? 0) + 1);
  }
  const maxVoiceCount = Math.max(0, ...voiceCounts.values());

  // Build set of already-earned features
  const earned = new Set(
    (existingUnlocks.data ?? []).map(
      (e: { feature: string }) => e.feature,
    ),
  );

  // Check which features are newly eligible
  const newlyEligible: string[] = [];

  if (totalReviews >= THRESHOLDS.style_quiz && !earned.has("style_quiz")) {
    newlyEligible.push("style_quiz");
  }
  if (totalReviews >= THRESHOLDS.wardrobe && !earned.has("wardrobe")) {
    newlyEligible.push("wardrobe");
  }
  if (
    maxVoiceCount >= THRESHOLDS.voice_swap_hint &&
    !earned.has("voice_swap_hint")
  ) {
    newlyEligible.push("voice_swap_hint");
  }

  // Insert newly eligible unlock_events (service role needed — no INSERT policy for users)
  if (newlyEligible.length > 0) {
    const { createServiceClient } = await import("../_shared/supabase.ts");
    const serviceClient = createServiceClient();
    await serviceClient.from("unlock_events").insert(
      newlyEligible.map((feature) => ({
        user_id: userId,
        feature,
      })),
    );
  }

  return jsonResponse({
    total_reviews: totalReviews,
    unlocks: [
      ...(existingUnlocks.data ?? []),
      ...newlyEligible.map((f) => ({
        feature: f,
        earned_at: new Date().toISOString(),
        completed_at: null,
      })),
    ],
    newly_eligible: newlyEligible,
  });
});
