import { createFileRoute } from "@tanstack/react-router";

type Plano = "diario" | "mensal" | "trimestral" | "anual";

type LeadRow = {
  id: string;
  criado_em: string;
  external_reference: string | null;
  status_pagamento: string;
  email: string;
  telefone: string | null;
  nome: string;
  plano: Plano;
  checkout_id: string | null;
  payment_id: string | null;
  pix_gerado_em: string | null;
  comprado_em: string | null;
  observacoes: string | null;
};

type LookupResult =
  | { kind: "found"; lead: LeadRow; via: string }
  | { kind: "not_found"; reason: string }
  | { kind: "ambiguous"; reason: string };

const RECENT_LOOKUP_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeStatus(value: string | null) {
  return normalizeKey((value || "").trim());
}

function isScalar(value: unknown): value is string | number | boolean {
  return ["string", "number", "boolean"].includes(typeof value);
}

function collectValuesByKeys(
  input: unknown,
  targetKeys: Set<string>,
  seen = new WeakSet<object>(),
  values: unknown[] = [],
) {
  if (!input || typeof input !== "object") return values;

  if (Array.isArray(input)) {
    for (const item of input) collectValuesByKeys(item, targetKeys, seen, values);
    return values;
  }

  const record = input as Record<string, unknown>;
  if (seen.has(record)) return values;
  seen.add(record);

  for (const [key, value] of Object.entries(record)) {
    if (targetKeys.has(normalizeKey(key)) && isScalar(value)) {
      values.push(value);
    }

    if (value && typeof value === "object") {
      collectValuesByKeys(value, targetKeys, seen, values);
    }
  }

  return values;
}

function firstValue(input: unknown, keys: string[]) {
  const values = collectValuesByKeys(
    input,
    new Set(keys.map((key) => normalizeKey(key))),
  );

  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
  }

  return null;
}

function uniqueValues(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
}

function normalizePhone(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D+/g, "");
  return digits || null;
}

function resolveAppmaxEvent(
  rawEvent: string | null,
  rawStatus: string | null,
  rawPaymentMethod: string | null,
) {
  const normalizedEvent = normalizeStatus(rawEvent);
  const normalizedStatus = normalizeStatus(rawStatus);
  const normalizedPaymentMethod = normalizeStatus(rawPaymentMethod);
  const eventStatusText = [normalizedEvent, normalizedStatus]
    .filter(Boolean)
    .join(" ");
  const haystack = [eventStatusText, normalizedPaymentMethod]
    .filter(Boolean)
    .join(" ");
  const hasPixMethod = normalizedPaymentMethod.includes("pix");

  if (normalizedEvent === "order_pix_created") {
    return "pix_gerado" as const;
  }

  if (normalizedEvent === "order_paid_by_pix") {
    return "purchase_approved_pix" as const;
  }

  if (normalizedEvent === "order_paid") {
    return "purchase_approved" as const;
  }

  if (normalizedEvent === "order_approved") {
    return "order_approved_info" as const;
  }

  if (normalizedEvent === "payment_not_authorized") {
    return "payment_not_authorized" as const;
  }

  if (normalizedEvent === "order_refund") {
    return "refund" as const;
  }

  if (normalizedEvent === "order_pix_expired") {
    return "pix_expired" as const;
  }

  if (normalizedEvent === "order_chargeback_in_treatment") {
    return "chargeback" as const;
  }

  if (
    normalizedEvent === "order_billet_created" ||
    normalizedEvent === "order_billet_overdue"
  ) {
    return "billet_ignored" as const;
  }

  if (
    haystack.includes("chargeback") ||
    haystack.includes("refund") ||
    haystack.includes("reembols")
  ) {
    return "refund" as const;
  }

  if (
    haystack.includes("refused") ||
    haystack.includes("recus") ||
    haystack.includes("failed") ||
    haystack.includes("rejected") ||
    haystack.includes("cancel") ||
    haystack.includes("expired") ||
    haystack.includes("expir")
  ) {
    return "payment_not_authorized" as const;
  }

  const hasDirectPixEvent =
    eventStatusText.includes("pix_gerado") ||
    eventStatusText.includes("pix_generated") ||
    eventStatusText.includes("pix_created") ||
    eventStatusText.includes("generated_pix");
  const isWaitingForPayment =
    eventStatusText.includes("aguardando_pagamento") ||
    eventStatusText.includes("waiting_payment") ||
    eventStatusText.includes("awaiting_payment") ||
    eventStatusText.includes("pending_payment") ||
    eventStatusText.includes("pending") ||
    eventStatusText.includes("pendente");

  if (hasDirectPixEvent || (isWaitingForPayment && hasPixMethod)) {
    return "pix_gerado" as const;
  }

  if (isWaitingForPayment) {
    return "pending_unknown" as const;
  }

  return "ignored" as const;
}

function isPaidStatus(status: string | null) {
  return status === "aprovado";
}

function parseMoneyValue(value: string | null) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;

  const decimal =
    normalized.includes(",") && normalized.includes(".")
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(",", ".");
  const numberValue = Number(decimal);
  if (!Number.isFinite(numberValue)) return null;
  return numberValue;
}

function extractValorPago(payload: unknown) {
  const centsValue = parseMoneyValue(
    firstValue(payload, [
      "valor_pago_centavos",
      "paid_amount_cents",
      "amount_in_cents",
      "total_in_cents",
    ]),
  );
  if (centsValue != null) return centsValue / 100;

  return parseMoneyValue(
    firstValue(payload, [
      "valor_pago",
      "paid_amount",
      "amount_paid",
      "amount",
      "total",
      "total_amount",
      "value",
      "price",
    ]),
  );
}

function buildObservation(current: string | null, message: string) {
  if (!current) return message;
  if (current.includes(message)) return current;
  return `${current}\n${message}`;
}

async function queryUniqueLead(
  supabaseAdmin: any,
  {
    field,
    value,
    requirePendingRecent = false,
  }: {
    field:
      | "id"
      | "external_reference"
      | "checkout_id"
      | "payment_id"
      | "email"
      | "telefone";
    value: string;
    requirePendingRecent?: boolean;
  },
): Promise<LookupResult> {
  let query = supabaseAdmin
    .from("leads_checkout_br")
    .select(
      "id, criado_em, external_reference, status_pagamento, email, telefone, nome, plano, checkout_id, payment_id, pix_gerado_em, comprado_em, observacoes",
    )
    .order("criado_em", { ascending: false })
    .limit(2);

  if (field === "email") {
    query = query.ilike("email", value);
  } else {
    query = query.eq(field, value);
  }

  if (requirePendingRecent) {
    query = query
      .eq("status_pagamento", "pendente")
      .gte(
        "criado_em",
        new Date(Date.now() - RECENT_LOOKUP_WINDOW_MS).toISOString(),
      );
  }

  const { data, error } = await query;
  if (error) {
    console.error("[webhook-appmax] lookup error", { field, value, error });
    return { kind: "not_found", reason: `${field}:query_error` };
  }

  if (!data || data.length === 0) {
    return { kind: "not_found", reason: `${field}:empty` };
  }

  if (data.length > 1) {
    return { kind: "ambiguous", reason: `${field}:multiple_matches` };
  }

  return { kind: "found", lead: data[0] as LeadRow, via: `${field}:${value}` };
}

async function findLead(
  supabaseAdmin: any,
  payload: unknown,
  extracted: {
    leadId: string | null;
    externalReference: string | null;
    reference: string | null;
    checkoutId: string | null;
    orderId: string | null;
    transactionId: string | null;
    paymentId: string | null;
    email: string | null;
    phone: string | null;
  },
) {
  const directLeadIds = uniqueValues([
    extracted.externalReference,
    extracted.leadId,
    extracted.reference,
  ]);

  for (const leadId of directLeadIds) {
    const externalMatch = await queryUniqueLead(supabaseAdmin, {
      field: "external_reference",
      value: leadId,
    });
    if (externalMatch.kind !== "not_found") return externalMatch;

    const match = await queryUniqueLead(supabaseAdmin, { field: "id", value: leadId });
    if (match.kind !== "not_found") return match;
  }

  const checkoutCandidates = uniqueValues([extracted.checkoutId, extracted.orderId]);
  for (const checkoutValue of checkoutCandidates) {
    const match = await queryUniqueLead(supabaseAdmin, {
      field: "checkout_id",
      value: checkoutValue,
    });
    if (match.kind !== "not_found") return match;
  }

  const paymentCandidates = uniqueValues([extracted.paymentId, extracted.transactionId]);
  for (const paymentValue of paymentCandidates) {
    const match = await queryUniqueLead(supabaseAdmin, {
      field: "payment_id",
      value: paymentValue,
    });
    if (match.kind !== "not_found") return match;
  }

  if (extracted.email) {
    const match = await queryUniqueLead(supabaseAdmin, {
      field: "email",
      value: extracted.email,
      requirePendingRecent: true,
    });
    if (match.kind !== "not_found") return match;
  }

  const phoneCandidates = uniqueValues([
    extracted.phone,
    normalizePhone(extracted.phone),
    firstValue(payload, ["customer_phone", "phone_number", "buyer_phone"]),
  ]);
  for (const phone of phoneCandidates) {
    const match = await queryUniqueLead(supabaseAdmin, {
      field: "telefone",
      value: phone,
      requirePendingRecent: true,
    });
    if (match.kind !== "not_found") return match;
  }

  return { kind: "not_found", reason: "no_confident_match" } as const;
}

function normalizePaymentMethod(value: string | null) {
  const normalized = normalizeStatus(value);
  if (!normalized) return null;
  if (normalized.includes("pix")) return "pix";
  if (
    normalized.includes("card") ||
    normalized.includes("cartao") ||
    normalized.includes("credito") ||
    normalized.includes("credit")
  ) {
    return "cartao";
  }
  return value;
}

function summarizePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { kind: typeof payload };
  }

  const record = payload as Record<string, unknown>;
  return {
    topLevelKeys: Object.keys(record).slice(0, 40),
    hasCustomer: Boolean(record.customer || record.buyer || record.client),
    hasOrder: Boolean(record.order || record.order_id),
    hasTransaction: Boolean(record.transaction || record.transaction_id),
    hasPayment: Boolean(record.payment || record.payment_id),
  };
}

export const Route = createFileRoute("/api/public/webhook-appmax")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const providedToken =
          url.searchParams.get("token") ||
          request.headers.get("x-appmax-webhook-secret") ||
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const { getServerEnv } = await import("@/lib/config.server");
        const expectedToken = await getServerEnv("APPMAX_WEBHOOK_SECRET");

        if (!expectedToken) {
          console.error("[webhook-appmax] Missing APPMAX_WEBHOOK_SECRET");
          return new Response("Webhook not configured", { status: 500 });
        }

        if (!providedToken || providedToken !== expectedToken) {
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const payload = await request.json();
          console.log("[webhook-appmax] payload received", summarizePayload(payload));

          const rawEvent = firstValue(payload, [
            "event",
            "event_type",
            "event_name",
            "type",
            "action",
            "notification_type",
          ]);
          const rawStatus = firstValue(payload, [
            "status",
            "payment_status",
            "order_status",
            "transaction_status",
          ]);
          const email = firstValue(payload, [
            "email",
            "customer_email",
            "buyer_email",
            "client_email",
          ]);
          const phone = firstValue(payload, [
            "telefone",
            "phone",
            "customer_phone",
            "buyer_phone",
            "client_phone",
            "whatsapp",
          ]);
          const orderId = firstValue(payload, [
            "order_id",
            "order",
            "orderid",
            "checkout_id",
            "checkoutid",
          ]);
          const transactionId = firstValue(payload, [
            "transaction_id",
            "transaction",
            "transactionid",
            "payment_id",
            "paymentid",
          ]);
          const paymentId = firstValue(payload, [
            "payment_id",
            "paymentid",
            "transaction_id",
            "transactionid",
            "charge_id",
          ]);
          const checkoutId = firstValue(payload, [
            "checkout_id",
            "checkoutid",
            "order_id",
            "orderid",
          ]);
          const leadId = firstValue(payload, ["lead_id"]);
          const externalReference = firstValue(payload, [
            "external_reference",
            "externalreference",
          ]);
          const reference = firstValue(payload, ["reference"]);
          const rawFormaPagamento = firstValue(payload, [
            "forma_pagamento",
            "payment_method",
            "payment_method_type",
            "payment_type",
            "method",
          ]);
          const formaPagamento = normalizePaymentMethod(rawFormaPagamento);

          const eventType = resolveAppmaxEvent(
            rawEvent,
            rawStatus,
            rawFormaPagamento,
          );
          const eventName = rawEvent || rawStatus || eventType;
          const resolvedPaymentId = paymentId || transactionId || orderId;
          const resolvedCheckoutId = checkoutId || orderId;
          const valorPago = extractValorPago(payload);

          console.log("[webhook-appmax] extracted", {
            rawEvent,
            rawStatus,
            eventType,
            emailFound: Boolean(email),
            phoneFound: Boolean(phone),
            orderId,
            transactionId,
            paymentId,
            checkoutId,
            leadId,
            externalReference,
            reference,
            formaPagamento,
            valorPago,
          });

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const lookup = await findLead(supabaseAdmin, payload, {
            leadId,
            externalReference,
            reference,
            checkoutId,
            orderId,
            transactionId,
            paymentId,
            email,
            phone,
          });

          if (lookup.kind === "ambiguous") {
            console.warn("[webhook-appmax] ambiguous lead match", lookup);
            return new Response("ok", { status: 200 });
          }

          if (lookup.kind !== "found") {
            console.warn("[webhook-appmax] no safe lead match", {
              eventType,
              lookup,
              identifiers: {
                leadId,
                externalReference,
                reference,
                checkoutId: resolvedCheckoutId,
                paymentId: resolvedPaymentId,
                orderId,
                transactionId,
                emailFound: Boolean(email),
                phoneFound: Boolean(phone),
              },
            });
            return new Response("ok", { status: 200 });
          }

          const resolvedExternalReference =
            lookup.lead.external_reference || externalReference || leadId || reference;

          if (eventType === "pix_gerado") {
            if (isPaidStatus(lookup.lead.status_pagamento)) {
              console.log("[webhook-appmax] pix event ignored for paid lead", {
                via: lookup.via,
                leadId: lookup.lead.id,
                status_pagamento: lookup.lead.status_pagamento,
              });
              return new Response("ok", { status: 200 });
            }

            const now = new Date().toISOString();
            const { data: updatedLead, error: updateError } = await supabaseAdmin
              .from("leads_checkout_br")
              .update({
                status_pagamento: "pendente",
                etapa_funil: "pix_gerado",
                payment_provider: "appmax",
                forma_pagamento: "pix",
                pix_gerado_em: lookup.lead.pix_gerado_em || now,
                ultimo_evento_webhook: eventName,
                ultimo_webhook_em: now,
                erro_processamento: null,
                ...(resolvedExternalReference
                  ? { external_reference: resolvedExternalReference }
                  : {}),
                ...(resolvedPaymentId ? { payment_id: resolvedPaymentId } : {}),
                ...(resolvedCheckoutId ? { checkout_id: resolvedCheckoutId } : {}),
                atualizado_em: now,
              })
              .eq("id", lookup.lead.id)
              .select(
                "id, status_pagamento, etapa_funil, payment_provider, checkout_id, payment_id, forma_pagamento, pix_gerado_em, ultimo_evento_webhook, ultimo_webhook_em, atualizado_em",
              )
              .maybeSingle();

            if (updateError) {
              console.error("[webhook-appmax] pix update error", {
                leadId: lookup.lead.id,
                via: lookup.via,
                eventType,
                updateError,
              });
              return new Response("ok", { status: 200 });
            }

            console.log("[webhook-appmax] pix lead updated", {
              via: lookup.via,
              eventType,
              updatedLead,
            });

            return new Response("ok", { status: 200 });
          }

          if (eventType === "order_approved_info") {
            const now = new Date().toISOString();
            const { data: updatedLead, error: updateError } = await supabaseAdmin
              .from("leads_checkout_br")
              .update({
                ultimo_evento_webhook: eventName,
                ultimo_webhook_em: now,
                atualizado_em: now,
              })
              .eq("id", lookup.lead.id)
              .select(
                "id, status_pagamento, etapa_funil, comprado_em, ultimo_evento_webhook, ultimo_webhook_em, atualizado_em",
              )
              .maybeSingle();

            if (updateError) {
              console.error("[webhook-appmax] order approved info update error", {
                leadId: lookup.lead.id,
                via: lookup.via,
                eventType,
                updateError,
              });
              return new Response("ok", { status: 200 });
            }

            console.log("[webhook-appmax] order approved recorded as info", {
              via: lookup.via,
              eventType,
              updatedLead,
            });
            return new Response("ok", { status: 200 });
          }

          if (eventType === "payment_not_authorized") {
            const now = new Date().toISOString();
            if (isPaidStatus(lookup.lead.status_pagamento)) {
              console.log("[webhook-appmax] refused event ignored for paid lead", {
                via: lookup.via,
                leadId: lookup.lead.id,
                status_pagamento: lookup.lead.status_pagamento,
              });
              return new Response("ok", { status: 200 });
            }

            const { data: updatedLead, error: updateError } = await supabaseAdmin
              .from("leads_checkout_br")
              .update({
                status_pagamento: "rejeitado",
                etapa_funil: "pagamento_recusado",
                payment_provider: "appmax",
                recusado_em: now,
                ultimo_evento_webhook: eventName,
                ultimo_webhook_em: now,
                erro_processamento: null,
                ...(resolvedExternalReference
                  ? { external_reference: resolvedExternalReference }
                  : {}),
                ...(resolvedPaymentId ? { payment_id: resolvedPaymentId } : {}),
                ...(resolvedCheckoutId ? { checkout_id: resolvedCheckoutId } : {}),
                ...(formaPagamento ? { forma_pagamento: formaPagamento } : {}),
                atualizado_em: now,
              })
              .eq("id", lookup.lead.id)
              .select(
                "id, status_pagamento, etapa_funil, payment_provider, checkout_id, payment_id, forma_pagamento, recusado_em, ultimo_evento_webhook, ultimo_webhook_em, atualizado_em",
              )
              .maybeSingle();

            if (updateError) {
              console.error("[webhook-appmax] refused update error", {
                leadId: lookup.lead.id,
                via: lookup.via,
                eventType,
                updateError,
              });
              return new Response("ok", { status: 200 });
            }

            console.log("[webhook-appmax] refused lead updated", {
              via: lookup.via,
              eventType,
              updatedLead,
            });
            return new Response("ok", { status: 200 });
          }

          if (eventType === "refund") {
            const now = new Date().toISOString();
            const observation = buildObservation(
              lookup.lead.observacoes,
              `Reembolso informado pela Appmax em ${now}`,
            );
            const { data: updatedLead, error: updateError } = await supabaseAdmin
              .from("leads_checkout_br")
              .update({
                payment_provider: "appmax",
                reembolsado_em: now,
                ultimo_evento_webhook: eventName,
                ultimo_webhook_em: now,
                erro_processamento: null,
                observacoes: observation,
                ...(resolvedExternalReference
                  ? { external_reference: resolvedExternalReference }
                  : {}),
                ...(resolvedPaymentId ? { payment_id: resolvedPaymentId } : {}),
                ...(resolvedCheckoutId ? { checkout_id: resolvedCheckoutId } : {}),
                atualizado_em: now,
              })
              .eq("id", lookup.lead.id)
              .select(
                "id, status_pagamento, etapa_funil, payment_provider, reembolsado_em, observacoes, ultimo_evento_webhook, ultimo_webhook_em, atualizado_em",
              )
              .maybeSingle();

            if (updateError) {
              console.error("[webhook-appmax] refund update error", {
                leadId: lookup.lead.id,
                via: lookup.via,
                eventType,
                updateError,
              });
              return new Response("ok", { status: 200 });
            }

            console.log("[webhook-appmax] refund lead annotated", {
              via: lookup.via,
              eventType,
              updatedLead,
            });
            return new Response("ok", { status: 200 });
          }

          if (eventType === "pix_expired") {
            const now = new Date().toISOString();
            const statusUpdate = isPaidStatus(lookup.lead.status_pagamento)
              ? {}
              : { status_pagamento: "pendente" };
            const { data: updatedLead, error: updateError } = await supabaseAdmin
              .from("leads_checkout_br")
              .update({
                ...statusUpdate,
                payment_provider: "appmax",
                ultimo_evento_webhook: eventName,
                ultimo_webhook_em: now,
                erro_processamento: null,
                ...(resolvedExternalReference
                  ? { external_reference: resolvedExternalReference }
                  : {}),
                ...(resolvedPaymentId ? { payment_id: resolvedPaymentId } : {}),
                ...(resolvedCheckoutId ? { checkout_id: resolvedCheckoutId } : {}),
                atualizado_em: now,
              })
              .eq("id", lookup.lead.id)
              .select(
                "id, status_pagamento, etapa_funil, payment_provider, checkout_id, payment_id, ultimo_evento_webhook, ultimo_webhook_em, atualizado_em",
              )
              .maybeSingle();

            if (updateError) {
              console.error("[webhook-appmax] pix expired update error", {
                leadId: lookup.lead.id,
                via: lookup.via,
                eventType,
                updateError,
              });
              return new Response("ok", { status: 200 });
            }

            console.log("[webhook-appmax] pix expired recorded", {
              via: lookup.via,
              eventType,
              updatedLead,
            });
            return new Response("ok", { status: 200 });
          }

          if (eventType === "chargeback") {
            const now = new Date().toISOString();
            const observation = buildObservation(
              lookup.lead.observacoes,
              `Chargeback em tratamento informado pela Appmax em ${now}`,
            );
            const { data: updatedLead, error: updateError } = await supabaseAdmin
              .from("leads_checkout_br")
              .update({
                payment_provider: "appmax",
                ultimo_evento_webhook: eventName,
                ultimo_webhook_em: now,
                erro_processamento: null,
                observacoes: observation,
                ...(resolvedExternalReference
                  ? { external_reference: resolvedExternalReference }
                  : {}),
                ...(resolvedPaymentId ? { payment_id: resolvedPaymentId } : {}),
                ...(resolvedCheckoutId ? { checkout_id: resolvedCheckoutId } : {}),
                atualizado_em: now,
              })
              .eq("id", lookup.lead.id)
              .select(
                "id, status_pagamento, etapa_funil, payment_provider, observacoes, ultimo_evento_webhook, ultimo_webhook_em, atualizado_em",
              )
              .maybeSingle();

            if (updateError) {
              console.error("[webhook-appmax] chargeback update error", {
                leadId: lookup.lead.id,
                via: lookup.via,
                eventType,
                updateError,
              });
              return new Response("ok", { status: 200 });
            }

            console.log("[webhook-appmax] chargeback lead annotated", {
              via: lookup.via,
              eventType,
              updatedLead,
            });
            return new Response("ok", { status: 200 });
          }

          if (eventType !== "purchase_approved" && eventType !== "purchase_approved_pix") {
            console.log("[webhook-appmax] event ignored", {
              via: lookup.via,
              eventType,
              leadId: lookup.lead.id,
              rawEvent,
              rawStatus,
            });
            return new Response("ok", { status: 200 });
          }

          if (
            isPaidStatus(lookup.lead.status_pagamento) &&
            lookup.lead.comprado_em
          ) {
            const now = new Date().toISOString();
            const { data: updatedLead, error: updateError } = await supabaseAdmin
              .from("leads_checkout_br")
              .update({
                payment_provider: "appmax",
                ...(resolvedPaymentId ? { payment_id: resolvedPaymentId } : {}),
                ...(resolvedCheckoutId ? { checkout_id: resolvedCheckoutId } : {}),
                ...(resolvedExternalReference
                  ? { external_reference: resolvedExternalReference }
                  : {}),
                ...(formaPagamento ? { forma_pagamento: formaPagamento } : {}),
                ...(valorPago != null ? { valor_pago: valorPago } : {}),
                ultimo_evento_webhook: eventName,
                ultimo_webhook_em: now,
                erro_processamento: null,
                atualizado_em: now,
              })
              .eq("id", lookup.lead.id)
              .select(
                "id, status_pagamento, etapa_funil, payment_provider, checkout_id, payment_id, forma_pagamento, comprado_em, valor_pago, ultimo_evento_webhook, ultimo_webhook_em, atualizado_em",
              )
              .maybeSingle();

            if (updateError) {
              console.error("[webhook-appmax] duplicate payment safe update error", {
                leadId: lookup.lead.id,
                via: lookup.via,
                updateError,
              });
              return new Response("ok", { status: 200 });
            }

            console.log("[webhook-appmax] duplicate approved event ignored", {
              via: lookup.via,
              leadId: lookup.lead.id,
              compradoEm: lookup.lead.comprado_em,
              updatedLead,
            });

            return new Response("ok_duplicate", { status: 200 });
          }

          const compradoEm = new Date();
          const now = compradoEm.toISOString();

          const { data: updatedLead, error: updateError } = await supabaseAdmin
            .from("leads_checkout_br")
            .update({
              status_pagamento: "aprovado",
              etapa_funil: "pagamento_aprovado",
              payment_provider: "appmax",
              ...(resolvedPaymentId ? { payment_id: resolvedPaymentId } : {}),
              ...(resolvedCheckoutId ? { checkout_id: resolvedCheckoutId } : {}),
              ...(resolvedExternalReference
                ? { external_reference: resolvedExternalReference }
                : {}),
              ...(eventType === "purchase_approved_pix"
                ? { forma_pagamento: "pix" }
                : formaPagamento
                  ? { forma_pagamento: formaPagamento }
                  : {}),
              ...(valorPago != null ? { valor_pago: valorPago } : {}),
              ultimo_evento_webhook: eventName,
              ultimo_webhook_em: now,
              erro_processamento: null,
              comprado_em: now,
              atualizado_em: now,
            })
            .eq("id", lookup.lead.id)
            .select(
              "id, status_pagamento, etapa_funil, payment_provider, checkout_id, payment_id, forma_pagamento, comprado_em, valor_pago, ultimo_evento_webhook, ultimo_webhook_em, atualizado_em",
            )
            .maybeSingle();

          if (updateError) {
            console.error("[webhook-appmax] lead update error", {
              leadId: lookup.lead.id,
              via: lookup.via,
              eventType,
              updateError,
            });
            return new Response("ok", { status: 200 });
          }

          console.log("[webhook-appmax] lead updated", {
            via: lookup.via,
            eventType,
            updatedLead,
          });

          return new Response("ok", { status: 200 });
        } catch (error) {
          console.error("[webhook-appmax] handler error", error);
          return new Response("ok", { status: 200 });
        }
      },
    },
  },
});
