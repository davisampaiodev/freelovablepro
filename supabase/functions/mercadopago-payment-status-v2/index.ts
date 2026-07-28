import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

type CheckoutSession = {
  payment_id?: string | null;
  status?: string | null;
  value?: number | string | null;
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function env(name: string) {
  return String(Deno.env.get(name) || "").trim();
}

serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "GET") {
    return json({ success: false, error: "Método não permitido." }, 405);
  }

  try {
    const url = new URL(request.url);
    const externalReference = String(
      url.searchParams.get("external_reference") || "",
    ).trim();

    if (!/^mp_\d+_[a-f0-9]{12}$/i.test(externalReference)) {
      return json({ success: false, error: "Referência inválida." }, 400);
    }

    const supabaseUrl = env("SUPABASE_URL");
    const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ success: false, error: "Ambiente não configurado." }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabaseAdmin
      .from("checkout_sessions_v2")
      .select("payment_id,status,value")
      .eq("provider", "mercadopago")
      .eq("external_reference", externalReference)
      .maybeSingle<CheckoutSession>();

    if (error) {
      console.error("payment status lookup failed:", {
        code: error.code || "unknown",
      });
      return json({ success: false, error: "Falha ao confirmar pagamento." }, 500);
    }
    if (!data) {
      return json({ success: false, error: "Pagamento não encontrado." }, 404);
    }

    const status = String(data.status || "").trim().toLowerCase();
    const paymentId = String(data.payment_id || "").trim();
    const value = Number(data.value);
    const approved =
      status === "approved" &&
      Boolean(paymentId) &&
      Number.isFinite(value) &&
      value > 0;

    if (!approved) {
      return json({
        success: true,
        approved: false,
        status: status || "pending",
      });
    }

    return json({
      success: true,
      approved: true,
      status: "approved",
      paymentId,
      value,
      currency: "BRL",
      eventId: `mp_${paymentId}`,
    });
  } catch {
    return json({ success: false, error: "Falha ao confirmar pagamento." }, 500);
  }
});
