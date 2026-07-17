import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { FREELOVABLE_PLANS, isFreelovablePlanId } from "@/lib/freelovable-plans";

const QuerySchema = z.object({ lead_id: z.string().uuid() });
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function maskPhone(value: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";
  const suffix = digits.slice(-4).padStart(4, "*");
  return `(**) *****-${suffix}`;
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

export const Route = createFileRoute("/api/public/dados-checkout")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = QuerySchema.safeParse({
          lead_id: url.searchParams.get("lead_id"),
        });

        if (!parsed.success) return json({ success: false, error: "lead_id_invalido" }, 400);

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: lead, error } = await supabaseAdmin
            .from("leads_checkout_br")
            .select("id, nome, email, telefone, plano")
            .eq("id", parsed.data.lead_id)
            .maybeSingle();

          if (error) {
            console.error("[dados-checkout] Falha ao buscar lead", {
              leadId: parsed.data.lead_id,
              code: error.code,
            });
            return json({ success: false, error: "falha_carregar_checkout" }, 500);
          }

          if (!lead) return json({ success: false, error: "lead_nao_encontrado" }, 404);
          if (!isFreelovablePlanId(lead.plano)) {
            return json({ success: false, error: "plano_invalido" }, 422);
          }

          const plan = FREELOVABLE_PLANS[lead.plano];
          return json({
            success: true,
            checkout: {
              lead_id: lead.id,
              nome: lead.nome,
              email: lead.email,
              telefone_mascarado: maskPhone(lead.telefone),
              plano: plan.id,
              nome_plano: plan.nome,
              valor: plan.valor,
            },
          });
        } catch (error) {
          console.error("[dados-checkout] Erro inesperado", {
            leadId: parsed.data.lead_id,
            error: error instanceof Error ? error.message : "unknown",
          });
          return json({ success: false, error: "falha_carregar_checkout" }, 500);
        }
      },
    },
  },
});
