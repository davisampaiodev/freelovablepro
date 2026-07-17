import { FREELOVABLE_PLANS, isFreelovablePlanId } from "@/lib/freelovable-plans";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { getServerEnv } from "@/lib/config.server";
import {
  isMercadoPagoStatus,
  shouldIgnoreMercadoPagoEvent,
  type MercadoPagoStatus,
} from "@/lib/mercado-pago-state";
type LeadRow = Database["public"]["Tables"]["leads_checkout_br"]["Row"];

export type NormalizedMercadoPagoPayment = {
  id: string;
  status: string;
  statusDetail: string | null;
  externalReference: string | null;
  transactionAmount: number | null;
  currencyId: string | null;
  paymentMethodId: string | null;
  paymentTypeId: string | null;
  installments: number | null;
  dateApproved: string | null;
  dateCreated: string | null;
  metadata: Record<string, unknown>;
  payerEmail: string | null;
};

export type MercadoPagoSyncResult = {
  payment: NormalizedMercadoPagoPayment;
  status: MercadoPagoStatus | null;
  leadId: string | null;
  validated: boolean;
  idempotent: boolean;
  ignored: boolean;
};

export class MercadoPagoSyncError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function nullableString(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function nullableNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isUuid(value: string | null): value is string {
  return Boolean(
    value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}

export async function getMercadoPagoPayment(
  paymentId: string,
): Promise<NormalizedMercadoPagoPayment> {
  if (!/^\d{1,30}$/.test(paymentId)) {
    throw new MercadoPagoSyncError("Invalid payment ID", "payment_id_invalido", false);
  }

  const accessToken = await getServerEnv("MERCADO_PAGO_ACCESS_TOKEN");
  if (!accessToken) {
    throw new MercadoPagoSyncError("Access Token ausente", "access_token_ausente", true);
  }

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const raw: unknown = await response.json().catch(() => null);
  if (!response.ok || !raw || typeof raw !== "object") {
    throw new MercadoPagoSyncError(
      "Payments API lookup failed",
      "consulta_pagamento_falhou",
      response.status >= 500,
    );
  }

  const payment = asRecord(raw);
  const payer = asRecord(payment.payer);
  return {
    id: nullableString(payment.id) ?? "",
    status: nullableString(payment.status) ?? "",
    statusDetail: nullableString(payment.status_detail),
    externalReference: nullableString(payment.external_reference),
    transactionAmount: nullableNumber(payment.transaction_amount),
    currencyId: nullableString(payment.currency_id),
    paymentMethodId: nullableString(payment.payment_method_id),
    paymentTypeId: nullableString(payment.payment_type_id),
    installments: nullableNumber(payment.installments),
    dateApproved: nullableString(payment.date_approved),
    dateCreated: nullableString(payment.date_created),
    metadata: asRecord(payment.metadata),
    payerEmail: nullableString(payer.email)?.toLowerCase() ?? null,
  };
}

const LEAD_FIELDS =
  "id, nome, email, plano, status_pagamento, etapa_funil, payment_provider, payment_id, forma_pagamento, valor_pago, comprado_em, recusado_em, reembolsado_em, ultimo_evento_webhook, ultimo_webhook_em, atualizado_em, erro_processamento, observacoes, criado_em";

async function findLeadById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("leads_checkout_br")
    .select(LEAD_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new MercadoPagoSyncError("Lead lookup failed", "lead_lookup_falhou", true);
  return data as LeadRow | null;
}

async function locateLead(payment: NormalizedMercadoPagoPayment): Promise<LeadRow | null> {
  const metadataLeadId = nullableString(payment.metadata.lead_id);
  for (const candidate of [payment.externalReference, metadataLeadId]) {
    if (!isUuid(candidate)) continue;
    const lead = await findLeadById(candidate);
    if (lead) return lead;
  }

  const { data: paymentLead, error: paymentError } = await supabaseAdmin
    .from("leads_checkout_br")
    .select(LEAD_FIELDS)
    .eq("payment_id", payment.id)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (paymentError) {
    throw new MercadoPagoSyncError("Payment lead lookup failed", "lead_lookup_falhou", true);
  }
  if (paymentLead) return paymentLead as LeadRow;

  if (!payment.payerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payment.payerEmail)) {
    return null;
  }
  const { data: emailLeads, error: emailError } = await supabaseAdmin
    .from("leads_checkout_br")
    .select(LEAD_FIELDS)
    .eq("email", payment.payerEmail)
    .order("criado_em", { ascending: false })
    .limit(10);
  if (emailError) {
    throw new MercadoPagoSyncError("Email fallback failed", "lead_lookup_falhou", true);
  }

  const candidates = (emailLeads ?? []) as LeadRow[];
  candidates.sort((left, right) => {
    const score = (lead: LeadRow) =>
      (lead.payment_provider === "mercado_pago" ? 4 : 0) +
      (lead.status_pagamento === "pendente" ? 2 : 0);
    return (
      score(right) - score(left) ||
      new Date(right.criado_em).getTime() - new Date(left.criado_em).getTime()
    );
  });
  const fallback = candidates[0] ?? null;
  if (fallback) {
    console.warn("[mercado-pago-sync] Lead localizado por fallback controlado de e-mail", {
      paymentId: payment.id,
      leadId: fallback.id,
    });
  }
  return fallback;
}

function validatePayment(payment: NormalizedMercadoPagoPayment, lead: LeadRow) {
  const errors: string[] = [];
  if (payment.id === "" || !/^\d{1,30}$/.test(payment.id)) errors.push("payment_id");
  if (payment.currencyId !== "BRL") errors.push("currency");
  if (payment.paymentTypeId !== "credit_card") errors.push("payment_type");
  if (!isFreelovablePlanId(lead.plano)) errors.push("plan");

  if (isFreelovablePlanId(lead.plano)) {
    const plan = FREELOVABLE_PLANS[lead.plano];
    const receivedCents =
      payment.transactionAmount == null ? null : Math.round(payment.transactionAmount * 100);
    if (receivedCents !== Math.round(plan.valor * 100)) errors.push("amount");
    if (
      payment.installments == null ||
      !Number.isInteger(payment.installments) ||
      payment.installments < 1 ||
      payment.installments > plan.maxParcelas
    ) {
      errors.push("installments");
    }
  }

  const metadataLeadId = nullableString(payment.metadata.lead_id);
  if (payment.externalReference && !isUuid(payment.externalReference)) {
    errors.push("external_reference_invalid");
  }
  if (metadataLeadId && !isUuid(metadataLeadId)) errors.push("metadata_lead_invalid");
  for (const reference of [payment.externalReference, metadataLeadId]) {
    if (isUuid(reference) && reference !== lead.id) errors.push("lead_reference");
  }
  const metadataPlan = nullableString(payment.metadata.plano);
  if (metadataPlan && metadataPlan !== lead.plano) errors.push("metadata_plan");

  return [...new Set(errors)];
}

function appendObservation(current: string | null, message: string) {
  if (current?.includes(message)) return current;
  return [current?.trim(), message].filter(Boolean).join("\n");
}

export async function syncMercadoPagoPayment(paymentId: string): Promise<MercadoPagoSyncResult> {
  const payment = await getMercadoPagoPayment(paymentId);
  if (payment.id !== paymentId) {
    throw new MercadoPagoSyncError("Payment ID mismatch", "payment_id_divergente", false);
  }

  const status = isMercadoPagoStatus(payment.status) ? payment.status : null;
  const lead = await locateLead(payment);
  if (!lead) {
    console.error("[mercado-pago-sync] Lead não encontrado", { paymentId });
    return { payment, status, leadId: null, validated: false, idempotent: false, ignored: true };
  }

  const validationErrors = validatePayment(payment, lead);
  if (validationErrors.length) {
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("leads_checkout_br")
      .update({
        erro_processamento: `mp_validation:${validationErrors.join(",")}`,
        ultimo_evento_webhook: "mp:validation_failed",
        ultimo_webhook_em: now,
        atualizado_em: now,
      })
      .eq("id", lead.id);
    if (error) {
      throw new MercadoPagoSyncError("Validation update failed", "lead_update_falhou", true);
    }
    return {
      payment,
      status,
      leadId: lead.id,
      validated: false,
      idempotent: false,
      ignored: true,
    };
  }

  if (!status) {
    return { payment, status, leadId: lead.id, validated: true, idempotent: false, ignored: true };
  }

  const eventName = `mp:${status}`;
  if (lead.payment_id === payment.id && lead.ultimo_evento_webhook === eventName) {
    return { payment, status, leadId: lead.id, validated: true, idempotent: true, ignored: false };
  }

  if (
    shouldIgnoreMercadoPagoEvent({
      currentPaymentId: lead.payment_id,
      currentStatus: lead.status_pagamento,
      eventPaymentId: payment.id,
      eventStatus: status,
    })
  ) {
    console.warn("[mercado-pago-sync] Evento fora de ordem ignorado", {
      leadId: lead.id,
      paymentId: payment.id,
      status,
    });
    return { payment, status, leadId: lead.id, validated: true, idempotent: false, ignored: true };
  }

  const now = new Date().toISOString();
  const common = {
    payment_provider: "mercado_pago",
    payment_id: payment.id,
    forma_pagamento: "cartao",
    ultimo_evento_webhook: eventName,
    ultimo_webhook_em: now,
    atualizado_em: now,
  };
  let update: Database["public"]["Tables"]["leads_checkout_br"]["Update"];

  if (status === "approved") {
    update = {
      ...common,
      status_pagamento: "aprovado",
      etapa_funil: "pagamento_aprovado",
      valor_pago: payment.transactionAmount,
      comprado_em: payment.dateApproved ?? now,
      erro_processamento: null,
    };
  } else if (status === "pending" || status === "in_process") {
    update = {
      ...common,
      status_pagamento: "pendente",
      etapa_funil: "checkout_iniciado",
    };
  } else if (status === "rejected") {
    update = {
      ...common,
      status_pagamento: "rejeitado",
      etapa_funil: "checkout_iniciado",
      recusado_em: now,
    };
  } else if (status === "cancelled") {
    update = common;
  } else if (status === "refunded") {
    update = { ...common, reembolsado_em: now };
  } else {
    update = {
      ...common,
      reembolsado_em: now,
      observacoes: appendObservation(lead.observacoes, `Chargeback Mercado Pago: ${payment.id}`),
    };
  }

  const { error: updateError } = await supabaseAdmin
    .from("leads_checkout_br")
    .update(update)
    .eq("id", lead.id);
  if (updateError) {
    throw new MercadoPagoSyncError("Lead update failed", "lead_update_falhou", true);
  }

  return { payment, status, leadId: lead.id, validated: true, idempotent: false, ignored: false };
}
