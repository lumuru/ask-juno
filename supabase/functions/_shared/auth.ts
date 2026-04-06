import { createUserClient } from "./supabase.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuthResult {
  userId: string;
  userClient: SupabaseClient;
}

export async function authenticateRequest(
  req: Request,
): Promise<AuthResult | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const userClient = createUserClient(authHeader);
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) return null;

  return { userId: user.id, userClient };
}
