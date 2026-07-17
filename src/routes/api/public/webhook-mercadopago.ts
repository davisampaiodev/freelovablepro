import { createFileRoute } from "@tanstack/react-router";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

export const Route = createFileRoute("/api/public/webhook-mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body: unknown = await request.json().catch(() => null);
        const { extractNotificationType, extractPaymentId, validateMercadoPagoSignature } =
          await import("@/lib/mercado-pago-webhook-signature");
        const paymentId = extractPaymentId(request, body);
        const notificationType = extractNotificationType(request, body);

        if (
          !paymentId ||
          (notificationType && !["payment", "payments"].includes(notificationType))
        ) {
          return json({ success: true, received: true, ignored: true });
        }

        const { getServerEnv } = await import("@/lib/config.server");
        const secret = await getServerEnv("MERCADO_PAGO_WEBHOOK_SECRET");
        if (!secret) {
          console.error("[webhook-mercadopago] Webhook Secret ausente");
          return json({ success: false, error: "webhook_indisponivel" }, 500);
        }

        const signatureValid = validateMercadoPagoSignature({
          signatureHeader: request.headers.get("x-signature"),
          requestId: request.headers.get("x-request-id"),
          dataId: paymentId,
          secret,
        });
        if (!signatureValid) {
          console.warn("[webhook-mercadopago] Assinatura inválida", { paymentId });
          return json({ success: false, error: "assinatura_invalida" }, 401);
        }

        try {
          const { syncMercadoPagoPayment } = await import("@/lib/mercado-pago-payment.server");
          const result = await syncMercadoPagoPayment(paymentId);
          return json({
            success: true,
            received: true,
            ...(result.idempotent ? { idempotent: true } : {}),
            ...(result.ignored ? { ignored: true } : {}),
          });
        } catch (error) {
          const { MercadoPagoSyncError } = await import("@/lib/mercado-pago-payment.server");
          if (error instanceof MercadoPagoSyncError && !error.retryable) {
            console.warn("[webhook-mercadopago] Evento não processável ignorado", {
              paymentId,
              code: error.code,
            });
            return json({ success: true, received: true, ignored: true });
          }
          console.error("[webhook-mercadopago] Falha ao sincronizar", {
            paymentId,
            code: error instanceof MercadoPagoSyncError ? error.code : "unknown",
          });
          return json({ success: false, error: "falha_sincronizar_pagamento" }, 500);
        }
      },
    },
  },
});
