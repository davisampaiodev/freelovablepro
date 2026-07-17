import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/dados-checkout")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          { success: false, error: "checkout_dados_movidos_para_sessao_do_navegador" },
          { status: 410, headers: { "Cache-Control": "no-store" } },
        ),
    },
  },
});
