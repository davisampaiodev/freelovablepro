import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Schema = z.object({
  lead_id: z.string().uuid(),
  tipo: z.enum([
    "formulario_sem_checkout",
    "checkout_iniciado",
    "pix_abandonado",
  ]),
});

export const Route = createFileRoute("/api/internal/whatsapp-mark-sent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { requireInternalAutomationSecret } = await import(
          "@/lib/whatsapp-preview.server"
        );
        const unauthorized = await requireInternalAutomationSecret(request);
        if (unauthorized) return unauthorized;

        const parsed = Schema.safeParse(await request.json());
        if (!parsed.success) {
          return Response.json(
            { error: "invalid payload", details: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { lead_id, tipo } = parsed.data;

        const { data: lead, error: lookupError } = await supabaseAdmin
          .from("leads_checkout_br")
          .select("id, quantidade_contatos")
          .eq("id", lead_id)
          .maybeSingle();

        if (lookupError) {
          console.error("[whatsapp-mark-sent] lookup error", {
            lead_id,
            lookupError,
          });
          return Response.json({ error: "lookup failed" }, { status: 500 });
        }

        if (!lead) {
          return Response.json({ error: "lead not found" }, { status: 404 });
        }

        const nextTentativas = (lead.quantidade_contatos ?? 0) + 1;
        const { data: updated, error: updateError } = await supabaseAdmin
          .from("leads_checkout_br")
          .update({
            whatsapp_status: "enviado",
            ultima_recuperacao_em: new Date().toISOString(),
            quantidade_contatos: nextTentativas,
            status_recuperacao: tipo,
            observacao_recuperacao: tipo,
            atualizado_em: new Date().toISOString(),
          })
          .eq("id", lead_id)
          .select(
            "id, whatsapp_status, ultima_recuperacao_em, quantidade_contatos, status_recuperacao, observacao_recuperacao",
          )
          .maybeSingle();

        if (updateError) {
          console.error("[whatsapp-mark-sent] update error", {
            lead_id,
            updateError,
          });
          return Response.json({ error: "update failed" }, { status: 500 });
        }

        return Response.json({ ok: true, lead: updated });
      },
    },
  },
});
