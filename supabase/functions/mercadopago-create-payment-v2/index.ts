// @ts-nocheck -- Supabase Edge Function, validated by Deno during deployment.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const notificationUrl =
  "https://dxqkzcyzlsnzhqlfybwu.supabase.co/functions/v1/mercadopago-webhook-v2";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PlanId = "diario" | "mensal" | "trimestral" | "anual";
type RequestBody = {
  lead_id?: string;
  plano?: PlanId;
  token?: string;
  payment_method_id?: string;
  issuer_id?: string | number | null;
  installments?: number;
  payer?: { email?: string; identification?: { type?: string; number?: string } };
  customer?: { name?: string; email?: string; phone?: string };
  tracking?: Record<string, string | undefined>;
  idempotency_key?: string;
};
type PlanConfig = {
  sessionPlanId: string;
  title: string;
  durationDays: number;
  price: number;
  maxInstallments: number;
};

const plans: Record<PlanId, PlanConfig> = {
  diario: {
    sessionPlanId: "plan_1d",
    title: "FreeLovable 1 dia",
    durationDays: 1,
    price: 17,
    maxInstallments: 1,
  },
  mensal: {
    sessionPlanId: "plan_30d",
    title: "FreeLovable 30 dias",
    durationDays: 30,
    price: 47,
    maxInstallments: 1,
  },
  trimestral: {
    sessionPlanId: "plan_90d",
    title: "FreeLovable 90 dias",
    durationDays: 90,
    price: 111,
    maxInstallments: 3,
  },
  // plan_3650d is the legacy identifier already used by the existing Function/table.
  anual: {
    sessionPlanId: "plan_3650d",
    title: "FreeLovable Anual",
    durationDays: 365,
    price: 324,
    maxInstallments: 12,
  },
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
function env(name: string) {
  return Deno.env.get(name)?.trim() || "";
}
function email(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}
function digits(value: unknown) {
  return String(value || "")
    .replace(/\D+/g, "")
    .trim();
}
function compact(record: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => Boolean(value)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Metodo nao permitido." }, 405);

  try {
    const accessToken = env("MP_V2_ACCESS_TOKEN");
    const supabaseUrl = env("SUPABASE_URL");
    const serviceRole = env("SUPABASE_SERVICE_ROLE_KEY");
    const resellerId = env("MP_V2_RESELLER_ID");
    if (!accessToken || !supabaseUrl || !serviceRole || !resellerId) {
      return json({ success: false, error: "Ambiente nao configurado." }, 500);
    }

    const body = (await req.json().catch(() => null)) as RequestBody | null;
    const leadId = String(body?.lead_id || "").trim();
    const planId = String(body?.plano || "").trim() as PlanId;
    const plan = plans[planId];
    const token = String(body?.token || "").trim();
    const paymentMethodId = String(body?.payment_method_id || "").trim();
    const isPix = paymentMethodId === "pix";
    const idempotencyKey = String(body?.idempotency_key || "").trim();
    const installments = Number(body?.installments);
    const customerName = String(body?.customer?.name || "").trim();
    const customerEmail = email(body?.customer?.email);
    const customerPhone = digits(body?.customer?.phone);
    const payerEmail = email(body?.payer?.email) || customerEmail;
    const idType = String(body?.payer?.identification?.type || "").trim();
    const idNumber = String(body?.payer?.identification?.number || "").trim();

    if (!uuidPattern.test(leadId)) return json({ success: false, error: "lead_id invalido." }, 400);
    if (!plan) return json({ success: false, error: "Plano invalido." }, 400);
    if (!paymentMethodId)
      return json({ success: false, error: "Forma de pagamento nao informada." }, 400);
    if (!uuidPattern.test(idempotencyKey))
      return json({ success: false, error: "Chave de idempotencia invalida." }, 400);
    if (!isPix && !token) return json({ success: false, error: "Token do cartao ausente." }, 400);
    if (!customerName || !customerEmail || !payerEmail) {
      return json({ success: false, error: "Cliente invalido." }, 400);
    }
    if (!isPix && ((idType && !idNumber) || (!idType && idNumber))) {
      return json({ success: false, error: "Identificacao invalida." }, 400);
    }
    if (
      !isPix &&
      (!Number.isInteger(installments) || installments < 1 || installments > plan.maxInstallments)
    ) {
      return json({ success: false, error: "Parcelas invalidas." }, 400);
    }

    const db = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
    const session = {
      provider: "mercadopago",
      external_reference: leadId,
      plan: plan.sessionPlanId,
      duration_days: plan.durationDays,
      value: plan.price,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_whatsapp: customerPhone || null,
      reseller_id: resellerId,
      status: "pending",
    };
    const { data: existing, error: lookupError } = await db
      .from("checkout_sessions_v2")
      .select("id, payment_id, status")
      .eq("provider", "mercadopago")
      .eq("external_reference", leadId)
      .maybeSingle();
    if (lookupError) return json({ success: false, error: "Falha ao consultar sessao." }, 500);
    if (existing?.status === "approved" && existing.payment_id) {
      return json({
        success: true,
        idempotent: true,
        payment: { id: String(existing.payment_id), status: "approved" },
      });
    }
    const sessionWrite = existing?.id
      ? await db.from("checkout_sessions_v2").update(session).eq("id", existing.id)
      : await db.from("checkout_sessions_v2").insert([session]);
    if (sessionWrite.error)
      return json({ success: false, error: "Falha ao preparar sessao." }, 500);

    const nameParts = customerName.split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() || customerName;
    const lastName = nameParts.join(" ") || ".";
    const issuerId = body?.issuer_id == null ? "" : String(body.issuer_id).trim();
    const metadata = {
      lead_id: leadId,
      plano: planId,
      plan: plan.sessionPlanId,
      duration_days: plan.durationDays,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_whatsapp: customerPhone,
      ...compact(body?.tracking || {}),
    };
    const additionalInfo = {
      items: [{ id: plan.sessionPlanId, title: plan.title, quantity: 1, unit_price: plan.price }],
      payer: { first_name: firstName, last_name: lastName, phone: { number: customerPhone } },
    };
    const pixPaymentPayload = {
      transaction_amount: plan.price,
      description: plan.title,
      payment_method_id: "pix",
      payer: { email: payerEmail },
      external_reference: leadId,
      notification_url: notificationUrl,
      metadata,
      additional_info: additionalInfo,
    };
    const cardPaymentPayload = {
      transaction_amount: plan.price,
      token,
      description: plan.title,
      installments,
      payment_method_id: paymentMethodId,
      ...(issuerId ? { issuer_id: issuerId } : {}),
      payer: {
        email: payerEmail,
        ...(idType ? { identification: { type: idType, number: idNumber } } : {}),
      },
      external_reference: leadId,
      notification_url: notificationUrl,
      metadata,
      additional_info: additionalInfo,
    };
    const paymentPayload = isPix ? pixPaymentPayload : cardPaymentPayload;
    const mercadoPagoResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentPayload),
    });
    const payment = await mercadoPagoResponse.json().catch(() => null);
    if (!mercadoPagoResponse.ok || !payment?.id || !payment?.status) {
      console.error("Mercado Pago payment error", {
        status: mercadoPagoResponse.status,
        cause: payment?.cause,
        message: payment?.message,
        error: payment?.error,
      });
      await db
        .from("checkout_sessions_v2")
        .update({ status: "error" })
        .eq("provider", "mercadopago")
        .eq("external_reference", leadId);
      return json(
        {
          success: false,
          error: "Falha ao criar pagamento.",
          details: String(
            payment?.message || payment?.error || "Pagamento recusado pelo provedor.",
          ),
        },
        mercadoPagoResponse.status >= 500 ? 502 : 422,
      );
    }
    const { error: updateError } = await db
      .from("checkout_sessions_v2")
      .update({ payment_id: String(payment.id), status: String(payment.status) })
      .eq("provider", "mercadopago")
      .eq("external_reference", leadId);
    if (updateError)
      return json({ success: false, error: "Pagamento criado, mas sessao nao atualizada." }, 500);

    const transactionData = payment?.point_of_interaction?.transaction_data;
    return json({
      success: true,
      payment: {
        id: String(payment.id),
        status: String(payment.status),
        ...(payment.status_detail ? { status_detail: String(payment.status_detail) } : {}),
        ...(transactionData?.qr_code ? { qr_code: String(transactionData.qr_code) } : {}),
        ...(transactionData?.qr_code_base64
          ? { qr_code_base64: String(transactionData.qr_code_base64) }
          : {}),
      },
    });
  } catch (error) {
    console.error(
      "mercadopago-create-payment-v2 error",
      error instanceof Error ? error.message : "unknown",
    );
    return json({ success: false, error: "Erro interno." }, 500);
  }
});
