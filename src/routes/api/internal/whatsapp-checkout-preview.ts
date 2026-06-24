import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/internal/whatsapp-checkout-preview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { buildWhatsAppPreview, requireInternalAutomationSecret } =
          await import("@/lib/whatsapp-preview.server");
        const unauthorized = await requireInternalAutomationSecret(request);
        if (unauthorized) return unauthorized;
        return buildWhatsAppPreview("checkout_iniciado");
      },
    },
  },
});
