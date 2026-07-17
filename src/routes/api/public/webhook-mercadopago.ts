import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhook-mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        console.log("[checkout:09] webhook recebido");
        try {
          const { getFelipeFunctionAuthHeaders, getFelipeFunctionUrl } =
            await import("@/lib/felipe-checkout.server");
          const body = await request.text();
          const query = new URL(request.url).search;
          const response = await fetch(
            `${await getFelipeFunctionUrl("mercadopago-webhook-v2")}${query}`,
            {
              method: "POST",
              headers: {
                "Content-Type": request.headers.get("content-type") || "application/json",
                ...(await getFelipeFunctionAuthHeaders()),
                ...(request.headers.get("x-signature")
                  ? { "x-signature": request.headers.get("x-signature")! }
                  : {}),
                ...(request.headers.get("x-request-id")
                  ? { "x-request-id": request.headers.get("x-request-id")! }
                  : {}),
              },
              body,
            },
          );
          const result = await response.json().catch(() => null);
          if (!response.ok) {
            console.error("[checkout:09] webhook remoto recusado", { status: response.status });
          } else if (
            result &&
            typeof result === "object" &&
            (result as { status?: string }).status === "approved"
          ) {
            console.log("[checkout:10] pagamento aprovado");
          }
          return Response.json(result ?? { success: response.ok }, { status: response.status });
        } catch (error) {
          console.error("[checkout:09] falha ao encaminhar webhook", {
            message: error instanceof Error ? error.message : "unknown",
          });
          return Response.json({ success: false, error: "webhook_indisponivel" }, { status: 500 });
        }
      },
    },
  },
});
