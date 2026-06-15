import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhook-mp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const xSignature = request.headers.get("x-signature");
          const xRequestId = request.headers.get("x-request-id");
          const dataIdFromQuery = url.searchParams.get("data.id");

          const bodyText = await request.text();
          let body: { type?: string; action?: string; data?: { id?: string | number } } = {};
          try { body = JSON.parse(bodyText); } catch { /* MP às vezes manda querystring */ }

          const dataId = String(body?.data?.id ?? dataIdFromQuery ?? "");
          if (!dataId) {
            return new Response("ok", { status: 200 });
          }

          const { verifyMpSignature, getPayment } = await import(
            "@/lib/mercadopago.server"
          );

          const valid = await verifyMpSignature({ xSignature, xRequestId, dataId });
          if (!valid) {
            console.warn("Assinatura MP inválida", { xSignature, xRequestId, dataId });
            return new Response("Invalid signature", { status: 401 });
          }

          // Só processa notificações de pagamento
          const topic = body?.type ?? url.searchParams.get("type");
          if (topic && topic !== "payment") {
            return new Response("ok", { status: 200 });
          }

          const payment = await getPayment(dataId);
          const assinaturaId = payment.external_reference;
          if (!assinaturaId) {
            console.warn("Pagamento sem external_reference", payment.id);
            return new Response("ok", { status: 200 });
          }

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          // Recupera assinatura
          const { data: assinatura, error: aerr } = await supabaseAdmin
            .from("assinaturas")
            .select("id, status, plano, email, nome, token_id")
            .eq("id", assinaturaId)
            .single();
          if (aerr || !assinatura) {
            console.error("Assinatura não encontrada", assinaturaId, aerr);
            return new Response("ok", { status: 200 });
          }

          // Mapeia status MP -> status interno
          let novoStatus: "aprovado" | "rejeitado" | "pendente" = "pendente";
          if (payment.status === "approved") novoStatus = "aprovado";
          else if (
            payment.status === "rejected" ||
            payment.status === "cancelled" ||
            payment.status === "refunded" ||
            payment.status === "charged_back"
          ) novoStatus = "rejeitado";

          // Se já estava aprovado e já tem token, não reprocessa
          if (assinatura.status === "aprovado" && assinatura.token_id) {
            return new Response("already_processed", { status: 200 });
          }

          if (novoStatus !== "aprovado") {
            await supabaseAdmin
              .from("assinaturas")
              .update({
                status: novoStatus,
                pagamento_mp_id: String(payment.id),
              })
              .eq("id", assinaturaId);
            return new Response("ok", { status: 200 });
          }

          // APROVADO — aloca próximo token disponível atomicamente
          const { PLANOS } = await import("@/lib/mercadopago.server");
          const dias = PLANOS[assinatura.plano as keyof typeof PLANOS].dias;
          const expiraEm = new Date(Date.now() + dias * 24 * 60 * 60 * 1000)
            .toISOString();

          // Pega um token disponível do mesmo plano (fallback: token sem plano)
          let { data: tokenRow, error: tErr } = await supabaseAdmin
            .from("tokens")
            .select("id, token")
            .eq("status", "disponivel")
            .eq("plano", assinatura.plano)
            .order("criado_em", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (!tErr && !tokenRow) {
            const fb = await supabaseAdmin
              .from("tokens")
              .select("id, token")
              .eq("status", "disponivel")
              .is("plano", null)
              .order("criado_em", { ascending: true })
              .limit(1)
              .maybeSingle();
            tokenRow = fb.data;
            tErr = fb.error;
          }

          if (tErr) {
            console.error("Erro ao buscar token:", tErr);
            return new Response("ok", { status: 200 });
          }

          if (!tokenRow) {
            // sem token disponível — marca assinatura como aprovada mas sem token, admin precisa adicionar
            await supabaseAdmin
              .from("assinaturas")
              .update({
                status: "aprovado",
                pagamento_mp_id: String(payment.id),
                expira_em: expiraEm,
              })
              .eq("id", assinaturaId);
            console.error("SEM TOKENS DISPONÍVEIS para assinatura", assinaturaId);
            return new Response("ok_no_token", { status: 200 });
          }

          // Reserva token: update condicional (status ainda 'disponivel')
          const { data: claimed, error: claimErr } = await supabaseAdmin
            .from("tokens")
            .update({
              status: "usado",
              assinatura_id: assinaturaId,
              usado_em: new Date().toISOString(),
            })
            .eq("id", tokenRow.id)
            .eq("status", "disponivel")
            .select("id, token")
            .maybeSingle();

          if (claimErr || !claimed) {
            console.error("Falha ao reservar token (race?):", claimErr);
            return new Response("ok", { status: 200 });
          }

          // Vincula token na assinatura
          await supabaseAdmin
            .from("assinaturas")
            .update({
              status: "aprovado",
              pagamento_mp_id: String(payment.id),
              token_id: claimed.id,
              token_valor: claimed.token,
              expira_em: expiraEm,
            })
            .eq("id", assinaturaId);

          // Envia email com o token (Lovable Emails — se infra estiver configurada)
          try {
            const { sendTokenEmail } = await import("@/lib/email-sender.server");
            await sendTokenEmail({
              nome: assinatura.nome,
              email: assinatura.email,
              token: claimed.token,
              plano: assinatura.plano as keyof typeof PLANOS,
              expiraEm,
            });
          } catch (e) {
            console.error("Falha ao enviar email do token:", e);
            // não falha o webhook — admin pode reenviar
          }

          return new Response("ok", { status: 200 });
        } catch (e) {
          console.error("webhook-mp error:", e);
          // sempre 200 para evitar retry agressivo do MP em erros não recuperáveis
          return new Response("ok", { status: 200 });
        }
      },
    },
  },
});
