// supabase/functions/webhook-revenuecat/index.ts

import { corsResponse, jsonResponse } from "../_shared/cors.ts";
import { badRequest, unauthorized, serverError } from "../_shared/errors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import type { SubscriptionStatus } from "../_shared/types.ts";

// RevenueCat event types we care about
const EVENT_TO_STATUS: Record<string, SubscriptionStatus> = {
  INITIAL_PURCHASE: "active",
  RENEWAL: "active",
  PRODUCT_CHANGE: "active",
  CANCELLATION: "cancelled",
  EXPIRATION: "expired",
  BILLING_ISSUE: "active", // still active until expiration
  SUBSCRIBER_ALIAS: "active", // no status change
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return badRequest("POST only");

  // Verify webhook secret
  const authHeader = req.headers.get("Authorization");
  const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
    return unauthorized();
  }

  let body: {
    event: {
      type: string;
      app_user_id: string;
      product_id?: string;
      expiration_at_ms?: number;
      purchase_at_ms?: number;
    };
  };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { event } = body;
  if (!event?.type || !event?.app_user_id) {
    return badRequest("Missing event type or app_user_id");
  }

  const newStatus = EVENT_TO_STATUS[event.type];
  if (!newStatus) {
    // Unknown event type — acknowledge but don't process
    return jsonResponse({ received: true, processed: false });
  }

  const serviceClient = createServiceClient();
  const userId = event.app_user_id;

  const upsertData: Record<string, unknown> = {
    user_id: userId,
    revenuecat_customer_id: userId,
    status: newStatus,
    last_synced_at: new Date().toISOString(),
  };

  if (event.product_id) {
    upsertData.product_id = event.product_id;
  }
  if (event.purchase_at_ms) {
    upsertData.current_period_start = new Date(event.purchase_at_ms).toISOString();
  }
  if (event.expiration_at_ms) {
    upsertData.current_period_end = new Date(event.expiration_at_ms).toISOString();
  }

  upsertData.will_renew = !["CANCELLATION", "EXPIRATION"].includes(event.type);

  const { error } = await serviceClient
    .from("subscriptions")
    .upsert(upsertData, { onConflict: "user_id" });

  if (error) {
    console.error("Subscription upsert error:", error);
    return serverError("Failed to update subscription");
  }

  return jsonResponse({ received: true, processed: true });
});
