import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { FREELOVABLE_PLANS, isFreelovablePlanId } from "@/lib/freelovable-plans";

const IdentificationSchema = z
  .object({
    type: z.string().trim().min(2).max(10),
    number: z.string().trim().min(5).max(30),
  })
  .strict();

const CommonPaymentSchema = z.object({
  lead_id: z.string().uuid(),
  idempotency_key: z.string().uuid(),
});

const PaymentSchema = CommonPaymentSchema.extend({
  token: z.string().trim().min(10).max(300).optional(),
  payment_method_id: z.string().trim().min(1).max(50),
  issuer_id: z.union([z.string(), z.number()]).nullish(),
  installments: z.number().int().positive().max(12).optional(),
  payer: z
    .object({
      email: z.string().email().optional(),
      identification: IdentificationSchema.optional(),
    })
    .strict()
    .optional(),
})
  .strict()
  .superRefine((input, context) => {
    if (input.payment_method_id === "pix") return;
    if (!input.token) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["token"], message: "Token ausente" });
    }
    if (!input.installments) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installments"],
        message: "Parcelas ausentes",
      });
    }
  });

const ALLOWED_STATUSES = new Set(["approved", "pending", "in_process", "rejected"]);
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const MP_CREATE_PAYMENT_FUNCTION_URL =
  "https://dxqkzcyzlsnzhqlfybwu.supabase.co/functions/v1/mercadopago-create-payment-v2";

type EdgeFunctionResponse = {
  success?: boolean;
  error?: string;
  payment?: {
    id?: string | number;
    status?: string;
    status_detail?: string;
    qr_code?: string;
    qr_code_base64?: string;
  };
  details?: string;
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

function compactRecord(record: Record<string, string | null | undefined>) {
  return Object.fromEntries(
    Object.entries(record).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

export const Route = createFileRoute("/api/public/processar-pagamento-mp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = PaymentSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return json({ success: false, error: "pagamento_invalido" }, 400);
        }

        const input = parsed.data;

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: lead, error: lookupError } = await supabaseAdmin
            .from("leads_checkout_br")
            .select(
              "id, nome, email, telefone, plano, status_pagamento, origem, campanha, criativo",
            )
            .eq("id", input.lead_id)
            .maybeSingle();

          if (lookupError) {
            console.error("[processar-pagamento-mp] Falha ao consultar lead", {
              leadId: input.lead_id,
              code: lookupError.code,
            });
            return json({ success: false, error: "pagamento_indisponivel" }, 500);
          }
          if (!lead) return json({ success: false, error: "lead_nao_encontrado" }, 404);
          if (!isFreelovablePlanId(lead.plano)) {
            return json({ success: false, error: "plano_invalido" }, 422);
          }
          if (lead.status_pagamento === "aprovado") {
            return json({ success: false, error: "pagamento_ja_aprovado" }, 409);
          }

          const plan = FREELOVABLE_PLANS[lead.plano];
          const isPix = input.payment_method_id === "pix";
          if (!isPix && input.installments! > plan.maxParcelas) {
            return json({ success: false, error: "parcelas_invalidas" }, 400);
          }

          const edgePayload = {
            lead_id: lead.id,
            plano: lead.plano,
            payment_method_id: input.payment_method_id,
            ...(isPix
              ? {}
              : {
                  token: input.token!,
                  issuer_id: input.issuer_id,
                  installments: input.installments!,
                }),
            payer: {
              email: lead.email,
              ...(!isPix && input.payer?.identification
                ? { identification: input.payer.identification }
                : {}),
            },
            customer: { name: lead.nome, email: lead.email, phone: lead.telefone || "" },
            tracking: compactRecord({
              origem: lead.origem,
              campanha: lead.campanha,
              criativo: lead.criativo,
            }),
            idempotency_key: input.idempotency_key,
          };

          const edgeResponse = await fetch(MP_CREATE_PAYMENT_FUNCTION_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(edgePayload),
          });
          const edgeResult = (await edgeResponse
            .json()
            .catch(() => null)) as EdgeFunctionResponse | null;
          const payment = edgeResult?.payment;

          if (!edgeResponse.ok || !edgeResult?.success || !payment?.id || !payment.status) {
            console.error("[processar-pagamento-mp] Edge Function recusou a requisição", {
              leadId: lead.id,
              status: edgeResponse.status,
              code: edgeResult?.error || "invalid_response",
            });
            return json(
              {
                success: false,
                error: edgeResult?.error || "Falha ao processar pagamento.",
                ...(edgeResult?.details ? { details: edgeResult.details } : {}),
              },
              edgeResponse.status >= 500 ? 502 : 422,
            );
          }
          if (!ALLOWED_STATUSES.has(payment.status)) {
            console.error("[processar-pagamento-mp] Status inesperado", {
              leadId: lead.id,
              paymentId: String(payment.id),
              status: payment.status,
            });
            return json({ success: false, error: "status_pagamento_inesperado" }, 502);
          }

          const now = new Date().toISOString();
          const baseUpdate = {
            payment_provider: "mercado_pago",
            payment_id: String(payment.id),
            forma_pagamento: isPix ? "pix" : "cartao",
            atualizado_em: now,
            ultimo_evento_webhook: `payment_response:${payment.status}`,
            ultimo_webhook_em: now,
          };
          const statusUpdate =
            payment.status === "approved"
              ? {
                  status_pagamento: "aprovado" as const,
                  etapa_funil: "pagamento_aprovado",
                  comprado_em: now,
                }
              : payment.status === "rejected"
                ? {
                    status_pagamento: "rejeitado" as const,
                    etapa_funil: "checkout_iniciado",
                    recusado_em: now,
                  }
                : {
                    status_pagamento: "pendente" as const,
                    etapa_funil: "checkout_iniciado",
                  };

          const { error: updateError } = await supabaseAdmin
            .from("leads_checkout_br")
            .update({ ...baseUpdate, ...statusUpdate })
            .eq("id", lead.id)
            .neq("status_pagamento", "aprovado");

          if (updateError) {
            console.error("[processar-pagamento-mp] Pagamento criado, atualização falhou", {
              leadId: lead.id,
              paymentId: String(payment.id),
              code: updateError.code,
            });
            return json({ success: false, error: "falha_atualizar_pagamento" }, 500);
          }

          return json({
            success: true,
            payment: {
              id: String(payment.id),
              status: payment.status,
              ...(payment.status_detail ? { status_detail: payment.status_detail } : {}),
              ...(payment.qr_code ? { qr_code: payment.qr_code } : {}),
              ...(payment.qr_code_base64 ? { qr_code_base64: payment.qr_code_base64 } : {}),
            },
          });
        } catch (error) {
          console.error("[processar-pagamento-mp] Erro inesperado", {
            leadId: input.lead_id,
            error: error instanceof Error ? error.message : "unknown",
          });
          return json({ success: false, error: "pagamento_indisponivel" }, 500);
        }
      },
    },
  },
});
