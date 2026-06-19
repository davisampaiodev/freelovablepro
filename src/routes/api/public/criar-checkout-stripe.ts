import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Schema = z.object({
  leadId: z.string().uuid(),
  plano: z.enum(["diario", "mensal", "trimestral", "anual"]),
  email: z.string().trim().email().max(255),
});

export const Route = createFileRoute("/api/public/criar-checkout-stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const parsed = Schema.safeParse(await request.json());
          if (!parsed.success) {
            return Response.json({ error: "Dados inválidos" }, { status: 400 });
          }

          const url = new URL(request.url);
          const siteUrl =
            process.env.SITE_URL || `${url.protocol}//${url.host}`;
          const { createStripeCheckoutSession } = await import(
            "@/lib/stripe.server"
          );
          const session = await createStripeCheckoutSession({
            ...parsed.data,
            siteUrl: siteUrl.replace(/\/$/, ""),
          });

          if (!session.url) {
            throw new Error("Stripe não retornou a URL do checkout");
          }

          try {
            const { getSupabaseExternalAdmin } = await import(
              "@/integrations/supabase-external/client.server"
            );
            const { error } = await getSupabaseExternalAdmin()
              .from("leads_checkout")
              .update({
                checkout_id: session.id,
                payment_provider: "stripe",
              })
              .eq("id", parsed.data.leadId);

            if (error) throw error;
          } catch (error) {
            console.warn(
              "Sessão Stripe criada, mas checkout_id não foi gravado. Configure SUPABASE_EXTERNAL_URL e SUPABASE_EXTERNAL_SERVICE_ROLE_KEY.",
              {
                message: error instanceof Error ? error.message : String(error),
              },
            );
          }

          return Response.json({
            checkoutUrl: session.url,
            checkoutId: session.id,
          });
        } catch (error) {
          console.error("criar-checkout-stripe error:", {
            message: error instanceof Error ? error.message : String(error),
          });
          return Response.json(
            { error: "Checkout internacional ainda não configurado" },
            { status: 503 },
          );
        }
      },
    },
  },
});
