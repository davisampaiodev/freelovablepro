import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Schema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  telefone: z.string().trim().min(8).max(30).optional().or(z.literal("")),
  plano: z.enum(["diario", "mensal", "trimestral", "anual"]),
});

export const Route = createFileRoute("/api/public/criar-preferencia")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const json = await request.json();
          const parsed = Schema.safeParse(json);
          if (!parsed.success) {
            return Response.json(
              { error: "Dados inválidos", details: parsed.error.flatten() },
              { status: 400 },
            );
          }
          const { nome, email, telefone, plano } = parsed.data;

          const { PLANOS, createPreference } = await import(
            "@/lib/mercadopago.server"
          );
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const valor = PLANOS[plano].centavos;
          const referer = request.headers.get("referer");
          const refererUrl = referer ? new URL(referer) : null;
          const refererParams = refererUrl?.searchParams;

          const { data: assinatura, error: insErr } = await supabaseAdmin
            .from("leads_checkout_br")
            .insert({
              nome,
              email,
              telefone: telefone || null,
              plano,
              status: "pendente",
              origem: "lp_brasil",
              idioma: "pt",
              utm_source: refererParams?.get("utm_source") || null,
              utm_medium: refererParams?.get("utm_medium") || null,
              utm_campaign: refererParams?.get("utm_campaign") || null,
              utm_content: refererParams?.get("utm_content") || null,
              utm_term: refererParams?.get("utm_term") || null,
              utm_id: refererParams?.get("utm_id") || null,
              fbclid: refererParams?.get("fbclid") || null,
              campaign_id: refererParams?.get("campaign_id") || null,
              adset_id: refererParams?.get("adset_id") || null,
              ad_id: refererParams?.get("ad_id") || null,
              valor_centavos: valor,
            })
            .select("id")
            .single();
          if (insErr || !assinatura) {
            console.error("Erro ao criar assinatura:", insErr);
            return Response.json(
              { error: "Falha ao registrar assinatura" },
              { status: 500 },
            );
          }

          const url = new URL(request.url);
          // MP_SITE_URL (produção fixa) tem precedência — evita usar o host
          // dinâmico do preview, que faz o MP rejeitar auto_return.
          const siteUrl = process.env.MP_SITE_URL || `${url.protocol}//${url.host}`;
          const notificationUrl =
            process.env.MP_NOTIFICATION_URL || `${siteUrl}/api/public/webhook-mp`;

          const pref = await createPreference({
            assinaturaId: assinatura.id,
            plano,
            nome,
            email,
            siteUrl,
            notificationUrl,
          });

          await supabaseAdmin
            .from("leads_checkout_br")
            .update({ preference_id: pref.id })
            .eq("id", assinatura.id);

          return Response.json({
            assinaturaId: assinatura.id,
            preferenceId: pref.id,
            initPoint: pref.init_point,
            sandboxInitPoint: pref.sandbox_init_point,
          });
        } catch (e) {
          console.error("criar-preferencia error:", e);
          return Response.json(
            { error: "Erro interno ao criar preferência" },
            { status: 500 },
          );
        }
      },
    },
  },
});
