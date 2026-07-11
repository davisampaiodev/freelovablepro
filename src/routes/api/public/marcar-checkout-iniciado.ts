import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const APPMAX_CHECKOUT_HOST = "freelovablepro.carrinho.app";

const Schema = z.object({
  lead_id: z.string().uuid(),
  checkout_url: z.string().url(),
});

function parseAllowedAppmaxCheckoutUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== APPMAX_CHECKOUT_HOST) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/marcar-checkout-iniciado")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null);
          const parsed = Schema.safeParse(body);

          if (!parsed.success) {
            return Response.json(
              {
                ok: false,
                error: "payload_invalido",
                details: parsed.error.flatten(),
              },
              { status: 400 },
            );
          }

          const { lead_id, checkout_url } = parsed.data;
          const parsedUrl = parseAllowedAppmaxCheckoutUrl(checkout_url);

          if (!parsedUrl) {
            return Response.json(
              {
                ok: false,
                error: "checkout_url_invalida",
              },
              { status: 400 },
            );
          }

          console.info("marcar-checkout-iniciado recebido", {
            leadId: lead_id,
            hostname: parsedUrl.hostname,
          });

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
            console.error("Falha ao atualizar checkout iniciado:", {
              leadId: lead_id,
              hostname: parsedUrl.hostname,
              supabaseError: {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
              },
            });

            return Response.json(
              {
                ok: false,
                error: "falha_atualizar_lead",
              },
              { status: 500 },
            );
          }

          if (!data) {
            console.error("Lead nao encontrado ao marcar checkout iniciado:", {
              leadId: lead_id,
              hostname: parsedUrl.hostname,
            });

            return Response.json(
              {
                ok: false,
                error: "lead_nao_encontrado",
              },
              { status: 404 },
            );
          }

          return Response.json({ ok: true, lead_id: data.id ?? lead_id });
        } catch (error) {
          console.error("Erro inesperado ao marcar checkout iniciado:", error);

          return Response.json(
            {
              ok: false,
              error: "erro_interno",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
