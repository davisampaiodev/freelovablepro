import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const QuerySchema = z.object({
  payment_id: z.string().regex(/^\d{1,30}$/),
  lead_id: z.string().uuid(),
});
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

function localStatus(lead: { status_pagamento: string; ultimo_evento_webhook: string | null }) {
  const eventStatus = lead.ultimo_evento_webhook?.startsWith("mp:")
    ? lead.ultimo_evento_webhook.slice(3)
    : null;
  if (["refunded", "charged_back", "cancelled"].includes(eventStatus ?? "")) {
    return eventStatus;
  }
  if (lead.status_pagamento === "aprovado") return "approved";
  if (lead.status_pagamento === "rejeitado") return "rejected";
  return eventStatus === "in_process" ? "in_process" : "pending";
}

export const Route = createFileRoute("/api/public/status-pagamento-mp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = QuerySchema.safeParse({
          payment_id: url.searchParams.get("payment_id"),
          lead_id: url.searchParams.get("lead_id"),
        });
        if (!parsed.success) return json({ success: false, error: "consulta_invalida" }, 400);

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: lead, error } = await supabaseAdmin
            .from("leads_checkout_br")
            .select("id, payment_id, payment_provider, status_pagamento, ultimo_evento_webhook")
            .eq("id", parsed.data.lead_id)
            .maybeSingle();
          if (error) return json({ success: false, error: "consulta_indisponivel" }, 500);
          if (
            !lead ||
            lead.payment_provider !== "mercado_pago" ||
            lead.payment_id !== parsed.data.payment_id
          ) {
            return json({ success: false, error: "pagamento_nao_encontrado" }, 404);
          }

          const currentStatus = localStatus(lead);
          if (currentStatus !== "pending" && currentStatus !== "in_process") {
            return json({
              success: true,
              payment: { id: parsed.data.payment_id, status: currentStatus },
            });
          }

          const { syncMercadoPagoPayment } = await import("@/lib/mercado-pago-payment.server");
          const result = await syncMercadoPagoPayment(parsed.data.payment_id);
          if (result.leadId !== lead.id || !result.validated || !result.status) {
            return json({ success: false, error: "pagamento_nao_confirmado" }, 409);
          }
          return json({
            success: true,
            payment: { id: result.payment.id, status: result.status },
          });
        } catch (error) {
          console.error("[status-pagamento-mp] Falha na consulta", {
            leadId: parsed.data.lead_id,
            paymentId: parsed.data.payment_id,
            error: error instanceof Error ? error.message : "unknown",
          });
          return json({ success: false, error: "consulta_indisponivel" }, 500);
        }
      },
    },
  },
});
