import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseExternal } from "@/integrations/supabase-external/client";

const nullableTrackingValue = z.string().trim().max(500).optional();

const Schema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  telefone: z.string().trim().min(8).max(30).optional().or(z.literal("")),
  plano: z.enum(["diario", "mensal", "trimestral", "anual"]),
  utm_source: nullableTrackingValue,
  utm_medium: nullableTrackingValue,
  utm_campaign: nullableTrackingValue,
  utm_content: nullableTrackingValue,
  utm_term: nullableTrackingValue,
  fbclid: nullableTrackingValue,
});

function valueOrNull(value?: string) {
  return value || null;
}

export const Route = createFileRoute("/api/public/leads-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const parsed = Schema.safeParse(await request.json());
          if (!parsed.success) {
            return Response.json({ error: "Dados inválidos" }, { status: 400 });
          }

          const data = parsed.data;
          const leadId = crypto.randomUUID();

          const { error } = await supabaseExternal
            .from("leads_checkout")
            .insert({
              id: leadId,
              nome: data.nome,
              email: data.email.toLowerCase(),
              telefone: valueOrNull(data.telefone),
              plano: data.plano,
              idioma: "es",
              origem: "lp_espanhol",
              status_venda: "pendente",
              payment_provider: "stripe",
              utm_source: valueOrNull(data.utm_source),
              utm_medium: valueOrNull(data.utm_medium),
              utm_campaign: valueOrNull(data.utm_campaign),
              utm_content: valueOrNull(data.utm_content),
              utm_term: valueOrNull(data.utm_term),
              fbclid: valueOrNull(data.fbclid),
            });

          if (error) {
            console.error("Falha ao salvar lead de checkout no Supabase:", {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
            });
            return Response.json(
              { error: "Falha ao registrar seus dados" },
              { status: 500 },
            );
          }

          return Response.json({ leadId });
        } catch (error) {
          console.error("leads-checkout error:", {
            message: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : undefined,
          });
          return Response.json(
            { error: "Erro interno ao registrar lead" },
            { status: 500 },
          );
        }
      },
    },
  },
});
