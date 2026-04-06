// supabase/functions/report/index.ts

import { corsResponse, jsonResponse } from "../_shared/cors.ts";
import { badRequest, unauthorized, serverError } from "../_shared/errors.ts";
import { authenticateRequest } from "../_shared/auth.ts";

const VALID_REASONS = new Set([
  "inaccurate",
  "offensive",
  "off_voice",
  "wrong_item",
  "other",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return badRequest("POST only");

  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();
  const { userId, userClient } = auth;

  let body: { review_id: string; reason: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (!body.review_id || !body.reason) {
    return badRequest("review_id and reason are required");
  }
  if (!VALID_REASONS.has(body.reason)) {
    return badRequest(
      `reason must be one of: ${[...VALID_REASONS].join(", ")}`,
    );
  }

  // Verify the review belongs to the user (RLS handles this)
  const { data: review } = await userClient
    .from("reviews")
    .select("id")
    .eq("id", body.review_id)
    .single();

  if (!review) {
    return badRequest("Review not found");
  }

  // Insert report (RLS allows user to insert their own)
  const { data, error } = await userClient.from("reports").insert({
    user_id: userId,
    review_id: body.review_id,
    reason: body.reason,
    note: body.note ?? null,
  }).select("id, created_at").single();

  if (error) {
    console.error("Report insert error:", error);
    return serverError("Failed to submit report");
  }

  return jsonResponse({ id: data.id, created_at: data.created_at }, 201);
});
