import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BodySchema = z.object({
  lead_id: z.string().uuid(),
  plano: z.enum(["diario", "mensal", "trimestral", "anual"]),
  payment_method_id: z.string().trim().min(1),
  token: z.string().trim().min(1).optional(),
  issuer_id: z.union([z.string(), z.number()]).nullish(),
  installments: z.number().int().min(1).max(12).optional(),
  payer: z
    .object({
      email: z.string().email().optional(),
      identification: z.object({ type: z.string(), number: z.string() }).optional(),
    })
    .optional(),
  customer: z.object({
    name: z.string().trim().min(2),
    email: z.string().email(),
    phone: z.string().trim().min(10),
  }),
  tracking: z.record(z.string()).optional(),
  idempotency_key: z.string().uuid(),
});

const DELIVERY_PLAN = {
  diario: "plan_1d",
  mensal: "plan_30d",
  trimestral: "plan_90d",
  anual: "plan_3650d",
} as const;

type ProviderResult = Record<string, unknown> & {
  success?: boolean;
  error?: unknown;
  details?: unknown;
  payment?: Record<string, unknown>;
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export const Route = createFileRoute("/api/public/processar-pagamento-mp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = BodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ success: false, error: "pagamento_invalido" }, 400);
        const input = parsed.data;
        const isPix = input.payment_method_id === "pix";
        if (!isPix && !input.token) {
          return json({ success: false, error: "token_cartao_ausente" }, 400);
        }

        try {
          const {
            FUNCTION_NAMES,
            getFelipeFunctionAuthHeaders,
            getFelipeFunctionUrl,
          } =
            await import("@/lib/felipe-checkout.server");
          const functionName = isPix
            ? FUNCTION_NAMES.createPreference
            : FUNCTION_NAMES.createPayment;
          const endpoint = getFelipeFunctionUrl(functionName);
          const payload = isPix
            ? {
                plan: DELIVERY_PLAN[input.plano],
                name: input.customer.name,
                email: input.customer.email,
                whatsapp: input.customer.phone,
              }
            : {
                lead_id: input.lead_id,
                plano: input.plano,
                token: input.token,
                payment_method_id: input.payment_method_id,
                issuer_id: input.issuer_id,
                installments: input.installments ?? 1,
                payer: input.payer,
                customer: input.customer,
                tracking: input.tracking,
                idempotency_key: input.idempotency_key,
              };

          console.log("[checkout:06] pagamento solicitado", {
            leadId: `${input.lead_id.slice(0, 8)}…${input.lead_id.slice(-4)}`,
            providerFunction: functionName,
            method: isPix ? "pix" : "credit_card",
          });
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getFelipeFunctionAuthHeaders(),
            },
            body: JSON.stringify(payload),
          });
          const result = (await response.json().catch(() => null)) as ProviderResult | null;
          console.log("[checkout:07] resposta Mercado Pago recebida", {
            providerFunction: functionName,
            status: response.status,
            success: result?.success === true,
          });
          if (!response.ok || result?.success !== true) {
            return json(
              {
                success: false,
                error: result?.error ?? "pagamento_recusado",
                details: result?.details,
              },
              response.status >= 500 ? 502 : response.status,
            );
          }

          const providerPayment = result.payment ?? result;
          const paymentId = String(providerPayment.id ?? result.payment_id ?? "");
          const status = String(providerPayment.status ?? result.status ?? "pending");
          if (!paymentId) return json({ success: false, error: "resposta_invalida" }, 502);

          console.log("[checkout:08] sessão criada pela Edge Function", {
            paymentId,
            status,
          });
          return json({
            success: true,
            external_reference: String(
              result.external_reference ?? providerPayment.external_reference ?? input.lead_id,
            ),
            payment: {
              id: paymentId,
              status,
              status_detail: providerPayment.status_detail ?? result.status_detail,
              qr_code: providerPayment.qr_code ?? result.qr_code,
              qr_code_base64: providerPayment.qr_code_base64 ?? result.qr_code_base64,
            },
          });
        } catch (error) {
          console.error("[checkout:06] falha no proxy de pagamento", {
            message: error instanceof Error ? error.message : "unknown",
            stack: error instanceof Error ? error.stack : undefined,
          });
          return json({ success: false, error: "pagamento_indisponivel" }, 500);
        }
      },
    },
  },
});
