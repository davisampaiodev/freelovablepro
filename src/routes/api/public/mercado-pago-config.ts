import { createFileRoute } from "@tanstack/react-router";

import { getServerEnv } from "@/lib/config.server";

export const Route = createFileRoute("/api/public/mercado-pago-config")({
  server: {
    handlers: {
      GET: async () => {
        // Esta chave é pública por definição do SDK do Mercado Pago. A service role
        // e qualquer credencial privada permanecem somente no Worker.
        const publicKey = (await getServerEnv("VITE_MERCADO_PAGO_PUBLIC_KEY")).trim();
        return Response.json(
          { public_key: publicKey || null },
          { headers: { "Cache-Control": "public, max-age=300" } },
        );
      },
    },
  },
});
