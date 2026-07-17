import { createFileRoute } from "@tanstack/react-router";

type LeadRow = {
  id: string;
  criado_em: string;
  status_pagamento: string;
  email: string;
  telefone: string | null;
  nome: string;
  plano: "diario" | "mensal" | "trimestral" | "anual";
  valor_oferta: number | null;
  origem: string | null;
  campanha: string | null;
  criativo: string | null;
  checkout_id: string | null;
  payment_id: string | null;
  external_reference: string | null;
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

function normalizePlan(value: string | null) {
  const normalized = normalizeStatus(value);
  if (normalized.includes("anual")) return "anual" as const;
  if (normalized.includes("trimes")) return "trimestral" as const;
  if (normalized.includes("diar")) return "diario" as const;
  if (normalized.includes("mens")) return "mensal" as const;
  return null;
}

function parseValorCentavos(value: string | null) {
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized) return null;

  if (/^\d+$/.test(normalized)) {
    const asInteger = Number(normalized);
    return Number.isFinite(asInteger) ? asInteger : null;
  }

  const numeric = normalized.replace(/\./g, "").replace(",", ".");
  const parsed = Number(numeric);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

function resolveWebhookEvent(rawEvent: string | null, rawStatus: string | null) {
  const normalizedEvent = normalizeStatus(rawEvent);
  const normalizedStatus = normalizeStatus(rawStatus);
  const haystack = [normalizedEvent, normalizedStatus].filter(Boolean).join(" ");

  if (haystack.includes("chargeback")) return "chargeback" as const;
  if (haystack.includes("refund") || haystack.includes("reembols")) {
    return "refund" as const;
  }
  if (
    haystack.includes("purchase_approved") ||
    haystack.includes("approved") ||
    haystack.includes("completed") ||
    normalizedStatus === "paid" ||
    normalizedStatus === "pago"
  ) {
    return "purchase_approved" as const;
  }
  if (
    haystack.includes("purchase_refused") ||
    haystack.includes("refused") ||
    haystack.includes("failed") ||
    haystack.includes("rejected") ||
    haystack.includes("cancel") ||
    haystack.includes("expired") ||
    haystack.includes("expir")
  ) {
    return "purchase_refused" as const;
  }
  if (haystack.includes("checkout_abandonment") || haystack.includes("abandon")) {
    return "checkout_abandonment" as const;
  }
  if (
    haystack.includes("pix_gerado") ||
    haystack.includes("pix_generated") ||
    haystack.includes("waiting_payment") ||
    haystack.includes("awaiting_payment") ||
    haystack.includes("pending") ||
    haystack.includes("pendente") ||
    haystack.includes("pix")
  ) {
    return "pix_gerado" as const;
  }

  return "pix_gerado" as const;
}

async function queryUniqueLead(
  supabaseAdmin: any,
  {
    field,
    value,
    requirePendingRecent = false,
  }: {
    field: "id" | "external_reference" | "checkout_id" | "payment_id" | "email" | "telefone";
    value: string;
    requirePendingRecent?: boolean;
  },
): Promise<LookupResult> {
  let query = supabaseAdmin
    .from("leads_checkout_br")
    .select(
      "id, criado_em, status_pagamento, email, telefone, nome, plano, valor_oferta, origem, campanha, criativo, checkout_id, payment_id, external_reference",
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
    console.error("[webhook-cakto] lookup error", { field, value, error });
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
  const directLeadIds = uniqueValues([extracted.leadId, extracted.reference]);

  for (const leadId of directLeadIds) {
    const match = await queryUniqueLead(supabaseAdmin, { field: "id", value: leadId });
    if (match.kind !== "not_found") return match;
  }

  if (extracted.externalReference) {
    const match = await queryUniqueLead(supabaseAdmin, {
      field: "external_reference",
      value: extracted.externalReference,
    });
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
    firstValue(payload, ["customer_phone", "phone_number"]),
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

function buildLeadUpdatePayload(params: {
  statusPagamento: "pendente" | "reprovado" | "aprovado";
  etapaFunil:
    | "formulario_preenchido"
    | "checkout_iniciado"
    | "pix_gerado"
    | "pagamento_aprovado"
    | "pagamento_recusado";
  checkoutId: string | null;
  paymentId: string | null;
  checkoutUrl?: string | null;
  compradoEm?: string;
  pixGeradoEm?: string;
  valor?: number | null;
  formaPagamento?: string | null;
}) {
  const payload: {
    status_pagamento: "pendente" | "reprovado" | "aprovado";
    etapa_funil:
      | "formulario_preenchido"
      | "checkout_iniciado"
      | "pix_gerado"
      | "pagamento_aprovado"
      | "pagamento_recusado";
    payment_provider: "cakto";
    atualizado_em: string;
    payment_id?: string;
    checkout_id?: string;
    checkout_url?: string;
    comprado_em?: string;
    pix_gerado_em?: string;
    valor_oferta?: number;
    forma_pagamento?: string;
  } = {
    status_pagamento: params.statusPagamento,
    etapa_funil: params.etapaFunil,
    payment_provider: "cakto",
    atualizado_em: new Date().toISOString(),
  };

  if (params.paymentId) payload.payment_id = params.paymentId;
  if (params.checkoutId) payload.checkout_id = params.checkoutId;
  if (params.checkoutUrl) payload.checkout_url = params.checkoutUrl;
  if (params.compradoEm) payload.comprado_em = params.compradoEm;
  if (params.pixGeradoEm) payload.pix_gerado_em = params.pixGeradoEm;
  if (params.valor != null) payload.valor_oferta = params.valor / 100;
  if (params.formaPagamento) payload.forma_pagamento = params.formaPagamento;

  return payload;
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
    hasCheckout: Boolean(record.checkout || record.checkout_id),
  };
}

export const Route = createFileRoute("/api/public/webhook-cakto")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const providedToken = url.searchParams.get("token");
        const { getServerEnv } = await import("@/lib/config.server");
        const expectedToken = await getServerEnv("CAKTO_WEBHOOK_SECRET");

        if (!expectedToken) {
          console.error("[webhook-cakto] Missing CAKTO_WEBHOOK_SECRET");
          return new Response("Webhook not configured", { status: 500 });
        }

        if (!providedToken || providedToken !== expectedToken) {
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const payload = await request.json();
          console.log("[webhook-cakto] payload received", summarizePayload(payload));

          const rawEvent = firstValue(payload, [
            "event",
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
          ]);
          const phone = firstValue(payload, [
            "telefone",
            "phone",
            "customer_phone",
            "buyer_phone",
            "whatsapp",
          ]);
          const name = firstValue(payload, [
            "nome",
            "name",
            "customer_name",
            "buyer_name",
          ]);
          const orderId = firstValue(payload, ["order_id", "order", "orderid"]);
          const transactionId = firstValue(payload, [
            "transaction_id",
            "transaction",
            "transactionid",
          ]);
          const paymentId = firstValue(payload, [
            "payment_id",
            "paymentid",
            "charge_id",
          ]);
          const checkoutId = firstValue(payload, [
            "checkout_id",
            "checkoutid",
          ]);
          const checkoutUrl = firstValue(payload, [
            "checkout_url",
            "checkout_link",
            "checkout_url_pix",
            "payment_url",
            "payment_link",
            "pix_url",
          ]);
          const leadId = firstValue(payload, ["lead_id"]);
          const externalReference = firstValue(payload, [
            "external_reference",
            "externalreference",
          ]);
          const reference = firstValue(payload, ["reference"]);
          const caktoEventId = firstValue(payload, [
            "event_id",
            "webhook_id",
            "notification_id",
            "id",
          ]);
          const product = firstValue(payload, [
            "plano",
            "produto",
            "product",
            "product_name",
            "offer_name",
            "plan",
          ]);
          const formaPagamento = firstValue(payload, [
            "forma_pagamento",
            "payment_method",
            "payment_method_type",
            "payment_type",
            "method",
          ]);

          const eventType = resolveWebhookEvent(rawEvent, rawStatus);
          const resolvedPaymentId = paymentId || transactionId || orderId;
          const resolvedCheckoutId = checkoutId || orderId;
          const resolvedPlan = normalizePlan(product);
          const valorCentavos =
            parseValorCentavos(
              firstValue(payload, [
                "valor_oferta",
                "valor_centavos",
                "amount_in_cents",
                "total_in_cents",
                "amount",
                "price",
                "total",
              ]),
            ) || null;
          console.log("[webhook-cakto] extracted", {
            rawEvent,
            eventType,
            rawStatus,
            emailFound: Boolean(email),
            phoneFound: Boolean(phone),
            nameFound: Boolean(name),
            orderId,
            transactionId,
            paymentId,
            checkoutId,
            checkoutUrl,
            leadId,
            externalReference,
            reference,
            caktoEventId,
            product,
            formaPagamento,
            resolvedPlan,
            valorCentavos,
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
            console.warn("[webhook-cakto] ambiguous lead match", lookup);
            return new Response("ok", { status: 200 });
          }

          if (lookup.kind !== "found") {
            console.warn("[webhook-cakto] no safe lead match", {
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

          const leadStatus =
            eventType === "purchase_approved"
              ? "aprovado"
              : eventType === "purchase_refused" ||
                  eventType === "refund" ||
                  eventType === "chargeback"
                ? "reprovado"
                : "pendente";
          const etapaFunil =
            eventType === "purchase_approved"
              ? "pagamento_aprovado"
              : eventType === "purchase_refused" ||
                  eventType === "refund" ||
                  eventType === "chargeback"
                ? "pagamento_recusado"
                : eventType === "checkout_abandonment"
                  ? "checkout_iniciado"
                  : "pix_gerado";
          const now = new Date().toISOString();
          const resolvedFormaPagamento =
            formaPagamento || (eventType === "pix_gerado" ? "pix" : null);

          const { data: updatedLead, error: updateError } = await supabaseAdmin
            .from("leads_checkout_br")
            .update(
              buildLeadUpdatePayload({
                statusPagamento: leadStatus,
                etapaFunil,
                checkoutId: resolvedCheckoutId,
                paymentId: resolvedPaymentId,
                checkoutUrl,
                compradoEm: leadStatus === "aprovado" ? now : undefined,
                pixGeradoEm:
                  etapaFunil === "pix_gerado" || etapaFunil === "pagamento_aprovado"
                    ? now
                    : undefined,
                valor: valorCentavos,
                formaPagamento: resolvedFormaPagamento,
              }),
            )
            .eq("id", lookup.lead.id)
            .select(
              "id, status_pagamento, etapa_funil, payment_provider, checkout_id, payment_id, pix_gerado_em, comprado_em, atualizado_em",
            )
            .maybeSingle();

          if (updateError) {
            console.error("[webhook-cakto] lead update error", {
              leadId: lookup.lead.id,
              via: lookup.via,
              eventType,
              updateError,
            });
            return new Response("ok", { status: 200 });
          }

          if (eventType === "purchase_approved") {
            try {
              const { sendMetaCapiEvent } = await import("@/lib/meta-capi.server");
              await sendMetaCapiEvent({
                eventName: "Purchase",
                eventId: `purchase_${lookup.lead.id}`,
                externalId: lookup.lead.external_reference || lookup.lead.id,
                eventSourceUrl: new URL(request.url).origin,
                email: lookup.lead.email,
                phone: lookup.lead.telefone,
                value: valorCentavos != null ? valorCentavos / 100 : undefined,
                currency: "BRL",
                contentId: resolvedPlan || lookup.lead.plano,
                contentName: `FreeLovable ${resolvedPlan || lookup.lead.plano}`,
              });
            } catch (metaCapiError) {
              console.error("[webhook-cakto] Meta CAPI Purchase failed", {
                leadId: lookup.lead.id,
                metaCapiError,
              });
            }
          }

          console.log("[webhook-cakto] lead updated", {
            via: lookup.via,
            eventType,
            updatedLead,
          });

          return new Response("ok", { status: 200 });
        } catch (error) {
          console.error("[webhook-cakto] handler error", error);
          return new Response("ok", { status: 200 });
        }
      },
    },
  },
});
