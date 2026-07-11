import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const APPMAX_CHECKOUT_HOST = "freelovablepro.carrinho.app";

const Schema = z.object({
  lead_id: z.string().uuid(),
  checkout_url: z.string().url(),
});

function isAllowedAppmaxCheckoutUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === APPMAX_CHECKOUT_HOST;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/marcar-checkout-iniciado")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const parsed = Schema.safeParse(body);

        if (!parsed.success) {
          return Response.json(
            { error: "invalid payload", details: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const { lead_id, checkout_url } = parsed.data;
        if (!isAllowedAppmaxCheckoutUrl(checkout_url)) {
          return Response.json(
            { error: "checkout_url is not an allowed Appmax URL" },
            { status: 400 },
          );
        }

        const now = new Date().toISOString();
        const updatePayload = {
          payment_provider: "appmax",
          etapa_funil: "checkout_iniciado",
          checkout_url,
          checkout_iniciado_em: now,
          atualizado_em: now,
        };

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const { data, error } = await supabaseAdmin
          .from("leads_checkout_br")
          .update(updatePayload)
          .eq("id", lead_id)
          .select("id")
          .maybeSingle();

        if (error) {
          console.error("[marcar-checkout-iniciado] update error", {
            lead_id,
            checkout_url,
            updatePayload,
            error,
          });
          return Response.json({ error: "update failed" }, { status: 500 });
        }

        if (!data) {
          console.error("[marcar-checkout-iniciado] lead not found", {
            lead_id,
            checkout_url,
            updatePayload,
          });
          return Response.json({ error: "lead not found" }, { status: 404 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
