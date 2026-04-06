// supabase/functions/_shared/errors.ts

import { jsonResponse } from "./cors.ts";

export function errorResponse(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
): Response {
  return jsonResponse({ error: code, message, ...extra }, status);
}

export function badRequest(message: string): Response {
  return errorResponse(400, "bad_request", message);
}

export function unauthorized(): Response {
  return errorResponse(401, "unauthorized", "Missing or invalid authorization");
}

export function forbidden(message: string): Response {
  return errorResponse(403, "forbidden", message);
}

export function capReached(resetAt: string): Response {
  return errorResponse(402, "cap_reached", "Weekly free review limit reached", {
    reason: "cap_reached",
    reset_at: resetAt,
  });
}

export function paidCapReached(): Response {
  return errorResponse(402, "paid_daily_cap", "Daily review limit reached", {
    reason: "paid_daily_cap",
  });
}

export function serverError(message: string): Response {
  return errorResponse(500, "internal_error", message);
}
