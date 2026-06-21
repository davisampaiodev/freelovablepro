import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zezxfslccmieiwrbwtzf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_O4AQoW8WoxxwULHlmsMcrQ_pKyFnrid";

export const supabaseExternal = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const PLANO_CENTAVOS: Record<
  "diario" | "mensal" | "trimestral" | "anual",
  number
> = {
  diario: 990,
  mensal: 4700,
  trimestral: 9700,
  anual: 19700,
};
