// supabase/functions/review/index.ts

import { corsResponse, jsonResponse } from "../_shared/cors.ts";
import {
  badRequest,
  capReached,
  paidCapReached,
  serverError,
  unauthorized,
} from "../_shared/errors.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { detectMimeType, ALLOWED_MIME_TYPES } from "../_shared/image-validation.ts";
import { computeWeekStart, determineModel, evaluateCap } from "../_shared/cap-check.ts";
import { buildUserPrompt } from "../_shared/prompt-builder.ts";
import { callClaudeForReview, estimateCostCents } from "../_shared/claude.ts";
import type {
  AppConfig,
  Profile,
  ReviewRequest,
  StylistVoice,
} from "../_shared/types.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return badRequest("POST only");

  // 1. Auth
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();
  const { userId, userClient } = auth;
  const serviceClient = createServiceClient();

  // 2. Parse request body
  let body: ReviewRequest;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  if (!body.photo_storage_path || !body.context) {
    return badRequest("photo_storage_path and context are required");
  }
  if (!["store", "online", "home"].includes(body.context)) {
    return badRequest("context must be store, online, or home");
  }

  // 3. Load profile, voice, app_config in parallel
  const [profileResult, configResult, subscriptionResult] = await Promise.all([
    userClient
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single(),
    serviceClient
      .from("app_config")
      .select("key, value"),
    serviceClient
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (profileResult.error || !profileResult.data) {
    return badRequest("Profile not found. Complete onboarding first.");
  }
  const profile = profileResult.data as Profile;

  // Parse app_config rows into a map
  const config: Record<string, unknown> = {};
  for (const row of (configResult.data ?? [])) {
    config[row.key] = row.value;
  }
  const appConfig: AppConfig = {
    free_tier_reviews_per_week: (config.free_tier_reviews_per_week as number) ?? 5,
    paid_daily_cap: (config.paid_daily_cap as number) ?? 50,
    claude_model_free: (config.claude_model_free as string) ?? "claude-haiku-4-5-20251001",
    claude_model_paid: (config.claude_model_paid as string) ?? "claude-sonnet-4-6",
    prompt_version_active: (config.prompt_version_active as string) ?? "v0",
    daily_cost_cap_cents: (config.daily_cost_cap_cents as number) ?? 10000,
    force_model_for_all: (config.force_model_for_all as string) ?? null,
    default_voice: (config.default_voice as string) ?? "parisian_editor",
  };

  // Determine subscription status
  const isPaid = ["trial", "active"].includes(
    subscriptionResult.data?.status ?? "free",
  );

  // 4. Load voice
  let voiceResult;
  if (profile.stylist_voice_id) {
    voiceResult = await serviceClient
      .from("stylist_voices")
      .select("*")
      .eq("id", profile.stylist_voice_id)
      .single();
  } else {
    voiceResult = await serviceClient
      .from("stylist_voices")
      .select("*")
      .eq("slug", appConfig.default_voice)
      .single();
  }
  if (voiceResult.error || !voiceResult.data) {
    return serverError("Voice not found");
  }
  const voice = voiceResult.data as StylistVoice;

  // 5. Cap check
  const now = new Date().toISOString();
  const weekStart = computeWeekStart(now, profile.timezone);

  const counterResult = await serviceClient
    .from("weekly_counters")
    .select("review_count")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  const currentCount = counterResult.data?.review_count ?? 0;
  const capResult = evaluateCap({
    isPaid,
    reviewCount: currentCount,
    freeCapPerWeek: appConfig.free_tier_reviews_per_week,
    paidDailyCap: appConfig.paid_daily_cap,
  });

  if (!capResult.allowed) {
    if (capResult.reason === "cap_reached") {
      // Calculate reset: next Monday
      const resetDate = new Date(weekStart);
      resetDate.setUTCDate(resetDate.getUTCDate() + 7);
      return capReached(resetDate.toISOString());
    }
    return paidCapReached();
  }

  // 6. Download image from storage
  const { data: imageData, error: downloadError } = await serviceClient.storage
    .from("scan-photos")
    .download(body.photo_storage_path);

  if (downloadError || !imageData) {
    return badRequest("Photo not found in storage");
  }

  // 7. Validate image magic bytes
  const imageBytes = new Uint8Array(await imageData.arrayBuffer());
  const detectedMime = detectMimeType(imageBytes);
  if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
    return badRequest("Unsupported image format. Use JPEG, PNG, or HEIC.");
  }

  // 8. Model routing
  const model = determineModel(
    isPaid,
    appConfig.claude_model_paid,
    appConfig.claude_model_free,
    appConfig.force_model_for_all,
  );

  // 9. Build prompt
  const userPrompt = buildUserPrompt(profile, body.context, voice.slug);

  // 10. Call Claude
  const imageBase64 = btoa(
    imageBytes.reduce((data, byte) => data + String.fromCharCode(byte), ""),
  );

  let reviewResult;
  try {
    reviewResult = await callClaudeForReview({
      systemPrompt: voice.prompt_system,
      userPrompt,
      imageBase64,
      imageMimeType: detectedMime,
      model,
    });
  } catch (err) {
    console.error("Claude API error:", err);
    return serverError("Review generation failed. Please try again.");
  }

  const { review, inputTokens, outputTokens } = reviewResult;
  const costCents = estimateCostCents(model, inputTokens, outputTokens);

  // 11. Safety flag — don't increment counter
  if (review.safety_flag) {
    return jsonResponse({
      ...review,
      model_used: model,
      prompt_version: appConfig.prompt_version_active,
    });
  }

  // 12. Persist review + increment counter (service role)
  const { data: insertedReview, error: insertError } = await serviceClient
    .from("reviews")
    .insert({
      user_id: userId,
      photo_storage_path: body.photo_storage_path,
      context: body.context,
      item_name: review.item.name || null,
      brand_guess: review.item.brand_guess_or_null,
      price_estimate: review.price_ballpark
        ? `${review.price_ballpark.low}-${review.price_ballpark.high} ${review.price_ballpark.currency}`
        : null,
      verdict: review.verdict,
      score: review.score,
      sections: review.sections,
      stylist_voice_id_used: voice.id,
      model_used: model,
      ai_cost_cents: costCents,
      prompt_version: appConfig.prompt_version_active,
      safety_flag: null,
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    console.error("Review insert error:", insertError);
    return serverError("Failed to save review");
  }

  // Increment weekly counter (upsert)
  await serviceClient.from("weekly_counters").upsert(
    {
      user_id: userId,
      week_start: weekStart,
      review_count: currentCount + 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,week_start" },
  );

  // 13. Return response
  return jsonResponse({
    id: insertedReview.id,
    created_at: insertedReview.created_at,
    ...review,
    model_used: model,
    prompt_version: appConfig.prompt_version_active,
  });
});
