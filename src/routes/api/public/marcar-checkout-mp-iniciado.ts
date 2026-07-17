import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BodySchema = z.object({ lead_id: z.string().uuid() });

export const Route = createFileRoute("/api/public/marcar-checkout-mp-iniciado")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = BodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ success: false, error: "payload_invalido" }, { status: 400 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: lead, error: lookupError } = await supabaseAdmin
            .from("leads_checkout_br")
            .select("id, status_pagamento, checkout_iniciado_em")
            .eq("id", parsed.data.lead_id)
            .maybeSingle();

          if (lookupError) {
            console.error("[marcar-checkout-mp-iniciado] Falha na consulta", {
              leadId: parsed.data.lead_id,
              code: lookupError.code,
            });
            return Response.json(
              { success: false, error: "falha_atualizar_lead" },
              { status: 500 },
            );
          }
          if (!lead) {
            return Response.json({ success: false, error: "lead_nao_encontrado" }, { status: 404 });
          }

          if (lead.status_pagamento === "aprovado") {
            return Response.json({ success: true, lead_id: lead.id, already_approved: true });
          }

          const now = new Date().toISOString();
          const { error: updateError } = await supabaseAdmin
            .from("leads_checkout_br")
            .update({
              etapa_funil: "checkout_iniciado",
              payment_provider: "mercado_pago",
              ...(lead.checkout_iniciado_em ? {} : { checkout_iniciado_em: now }),
              atualizado_em: now,
            })
            .eq("id", lead.id);

          if (updateError) {
            console.error("[marcar-checkout-mp-iniciado] Falha na atualização", {
              leadId: lead.id,
              code: updateError.code,
            });
            return Response.json(
              { success: false, error: "falha_atualizar_lead" },
              { status: 500 },
            );
          }

          return Response.json({ success: true, lead_id: lead.id });
        } catch (error) {
          console.error("[marcar-checkout-mp-iniciado] Erro inesperado", {
            leadId: parsed.data.lead_id,
            error: error instanceof Error ? error.message : "unknown",
          });
          return Response.json({ success: false, error: "erro_interno" }, { status: 500 });
        }
      },
    },
  },
});
