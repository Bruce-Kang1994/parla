import { createClient } from "@supabase/supabase-js";

// Service role client for admin operations (API routes only, never expose to browser)
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "[Supabase] Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    return null as unknown as ReturnType<typeof createClient>;
  }

  return createClient(url, key);
}
