import { normalizeBrazilPhone } from "@/lib/phone-br";
import {
  buildCheckoutIniciadoMessage,
  buildFormularioSemCheckoutMessage,
  buildPixAbandonadoMessage,
  sendWhatsAppMock,
} from "@/lib/whatsapp-provider";

type PreviewType = "formulario_sem_checkout" | "checkout_iniciado" | "pix_abandonado";

type LeadPreviewRow = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  plano: string | null;
  status: string | null;
  etapa_funil: string | null;
  whatsapp_tentativas: number | null;
  criado_em: string | null;
  updated_at: string | null;
};

const PREVIEW_CONFIG: Record<
  PreviewType,
  {
    view: string;
    messageBuilder: (input: { nome: string | null; plano: string | null }) => string;
  }
> = {
  formulario_sem_checkout: {
    view: "leads_formulario_sem_checkout_whatsapp",
    messageBuilder: buildFormularioSemCheckoutMessage,
  },
  checkout_iniciado: {
    view: "leads_checkout_iniciado_whatsapp",
    messageBuilder: buildCheckoutIniciadoMessage,
  },
  pix_abandonado: {
    view: "leads_pix_abandonado_whatsapp",
    messageBuilder: buildPixAbandonadoMessage,
  },
};

export async function requireInternalAutomationSecret(request: Request) {
  const { getServerEnv } = await import("@/lib/config.server");
  const expectedSecret = await getServerEnv("INTERNAL_AUTOMATION_SECRET");

  if (!expectedSecret) {
    return Response.json({ error: "internal automation not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const providedSecret =
    request.headers.get("x-internal-automation-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("token");

  if (!providedSecret || providedSecret !== expectedSecret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  return null;
}

export async function buildWhatsAppPreview(type: PreviewType) {
  const config = PREVIEW_CONFIG[type];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from(config.view)
    .select("id, nome, email, telefone, plano, status, etapa_funil, whatsapp_tentativas, criado_em, updated_at")
    .order("criado_em", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[whatsapp-preview] query error", {
      type,
      view: config.view,
      error,
    });
    return Response.json({ error: "preview query failed" }, { status: 500 });
  }

  const leads = ((data || []) as LeadPreviewRow[])
    .map((lead) => {
      const phone = normalizeBrazilPhone(lead.telefone);
      const mensagem = config.messageBuilder({ nome: lead.nome, plano: lead.plano });
      return {
        lead_id: lead.id,
        nome: lead.nome,
        plano: lead.plano,
        status: lead.status,
        etapa_funil: lead.etapa_funil,
        telefone_valido: phone.valid,
        telefone_mascarado: phone.masked,
        telefone_normalizado: phone.valid ? phone.e164 : null,
        telefone_invalido_motivo: phone.valid ? null : phone.reason,
        whatsapp_tentativas: lead.whatsapp_tentativas ?? 0,
        criado_em: lead.criado_em,
        updated_at: lead.updated_at,
        mock: phone.valid
          ? sendWhatsAppMock({
              telefone: phone.e164,
              mensagem,
              tipo: type,
            })
          : null,
      };
    })
    .filter((lead) => lead.telefone_valido);

  return Response.json({
    tipo: type,
    quantidade: leads.length,
    leads,
  });
}
