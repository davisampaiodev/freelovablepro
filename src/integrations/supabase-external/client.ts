import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zezxfslccmieiwrbwtzf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_O4AQoW8WoxxwULHlmsMcrQ_pKyFnrid";

export const supabaseExternal = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const PLANO_VALOR_OFERTA: Record<
  "diario" | "mensal" | "trimestral" | "anual",
  number
> = {
  diario: 17,
  mensal: 47,
  trimestral: 101.13,
  anual: 261.42,
};
