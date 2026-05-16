import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireServerEnv } from "@/lib/env";
import type { Database } from "@/lib/motive/types";

export function createSupabaseServiceRoleClient() {
  const env = requireServerEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}
