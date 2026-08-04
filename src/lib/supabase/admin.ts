import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { getSupabaseEnv } from "./env";

export function createAdminClient() {
  // Storage still requires the legacy JWT service-role credential for
  // Authorization-header based SDK operations. Prefer it when available while
  // retaining the newer secret key as a fallback for existing installations.
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing server environment variable: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY");
  }
  const { url } = getSupabaseEnv();
  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
