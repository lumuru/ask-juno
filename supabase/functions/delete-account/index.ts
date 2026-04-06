// supabase/functions/delete-account/index.ts

import { corsResponse, jsonResponse } from "../_shared/cors.ts";
import { badRequest, unauthorized, serverError } from "../_shared/errors.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const STORAGE_BUCKETS = ["scan-photos", "wardrobe-photos", "share-cards"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return badRequest("POST only");

  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();
  const { userId } = auth;
  const serviceClient = createServiceClient();

  // Require explicit confirmation in the body
  let body: { confirm: boolean };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  if (body.confirm !== true) {
    return badRequest('Send {"confirm": true} to delete your account');
  }

  // 1. Delete all storage objects for this user across all buckets
  const storageErrors: string[] = [];
  for (const bucket of STORAGE_BUCKETS) {
    const { data: files } = await serviceClient.storage
      .from(bucket)
      .list(userId);

    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      const { error } = await serviceClient.storage
        .from(bucket)
        .remove(paths);
      if (error) {
        storageErrors.push(`${bucket}: ${error.message}`);
      }
    }
  }

  if (storageErrors.length > 0) {
    console.error("Storage deletion errors:", storageErrors);
    // Continue with account deletion — storage errors are not blocking
  }

  // 2. Delete the auth user (cascades all table data via ON DELETE CASCADE)
  const { error: deleteError } =
    await serviceClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error("User deletion error:", deleteError);
    return serverError("Failed to delete account. Please try again or contact support.");
  }

  return jsonResponse({ deleted: true });
});
