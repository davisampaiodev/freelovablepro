import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/marcar-checkout-mp-iniciado")({
  server: {
    handlers: {
      POST: async () => Response.json({ success: true, deprecated: true }),
    },
  },
});
