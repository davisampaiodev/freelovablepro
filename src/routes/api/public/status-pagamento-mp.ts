import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const QuerySchema = z
  .object({
    external_reference: z.string().trim().min(1).optional(),
    payment_id: z
      .string()
      .regex(/^\d{1,30}$/)
      .optional(),
  })
  .refine((value) => value.external_reference || value.payment_id);

export const Route = createFileRoute("/api/public/status-pagamento-mp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = QuerySchema.safeParse({
          external_reference: url.searchParams.get("external_reference") || undefined,
          payment_id: url.searchParams.get("payment_id") || undefined,
        });
        if (!parsed.success) {
          return Response.json({ success: false, error: "consulta_invalida" }, { status: 400 });
        }
        try {
          const { FUNCTION_NAMES, getFelipeFunctionUrl } =
            await import("@/lib/felipe-checkout.server");
          const response = await fetch(getFelipeFunctionUrl(FUNCTION_NAMES.paymentStatus), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed.data),
          });
          const result = (await response.json().catch(() => null)) as Record<
            string,
            unknown
          > | null;
          if (!response.ok || result?.success !== true) {
            return Response.json(result ?? { success: false, error: "consulta_indisponivel" }, {
              status: response.status,
            });
          }
          const nested =
            result.payment && typeof result.payment === "object"
              ? (result.payment as Record<string, unknown>)
              : result;
          return Response.json(
            {
              success: true,
              payment: {
                id: String(nested.id ?? result.payment_id ?? parsed.data.payment_id ?? ""),
                status: String(nested.status ?? result.status ?? "pending"),
              },
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch (error) {
          console.error("[status-pagamento-mp] falha no proxy", {
            message: error instanceof Error ? error.message : "unknown",
          });
          return Response.json({ success: false, error: "consulta_indisponivel" }, { status: 500 });
        }
      },
    },
  },
});
