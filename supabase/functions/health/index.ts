// supabase/functions/health/index.ts

import { jsonResponse } from "../_shared/cors.ts";

Deno.serve((_req) => {
  return jsonResponse({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: Deno.env.get("SUPABASE_FUNCTION_VERSION") ?? "local",
  });
});
