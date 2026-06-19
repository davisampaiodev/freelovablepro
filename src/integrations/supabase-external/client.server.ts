import { createClient } from "@supabase/supabase-js";

function createSupabaseExternalAdminClient() {
  const url = process.env.SUPABASE_EXTERNAL_URL;
  const serviceRoleKey = process.env.SUPABASE_EXTERNAL_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    const missing = [
      ...(!url ? ["SUPABASE_EXTERNAL_URL"] : []),
      ...(!serviceRoleKey ? ["SUPABASE_EXTERNAL_SERVICE_ROLE_KEY"] : []),
    ];
    throw new Error(
      `Missing external Supabase environment variable(s): ${missing.join(", ")}`,
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let client: ReturnType<typeof createSupabaseExternalAdminClient> | undefined;

export function getSupabaseExternalAdmin() {
  if (!client) client = createSupabaseExternalAdminClient();
  return client;
}
