import { createClient } from "@supabase/supabase-js";
import { FREELOVABLE_PLANS } from "@/lib/freelovable-plans";

const SUPABASE_URL = "https://zezxfslccmieiwrbwtzf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_O4AQoW8WoxxwULHlmsMcrQ_pKyFnrid";

export const supabaseExternal = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const PLANO_VALOR_OFERTA: Record<"diario" | "mensal" | "trimestral" | "anual", number> = {
  diario: FREELOVABLE_PLANS.diario.valor,
  mensal: FREELOVABLE_PLANS.mensal.valor,
  trimestral: FREELOVABLE_PLANS.trimestral.valor,
  anual: FREELOVABLE_PLANS.anual.valor,
};
