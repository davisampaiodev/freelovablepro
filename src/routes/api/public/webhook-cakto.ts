import { createFileRoute } from "@tanstack/react-router";
import type { TablesInsert } from "@/integrations/supabase/types";

type LeadRow = {
  ad_id: string | null;
  adset_id: string | null;
  campaign_id: string | null;
  id: string;
  criado_em: string;
  status: string;
  email: string;
  telefone: string | null;
  nome: string;
  plano: "diario" | "mensal" | "trimestral" | "anual";
  valor_centavos: number;
  token_id: string | null;
  token_valor: string | null;
  expira_em: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id: string | null;
  fbclid: string | null;
  checkout_id: string | null;
  payment_id: string | null;
};

type AssinaturaRow = {
  id: string;
  lead_id: string | null;
  checkout_id: string | null;
  payment_id: string | null;
  status: string | null;
  status_pagamento: string | null;
};

type LookupResult =
  | { kind: "found"; lead: LeadRow; via: string }
  | { kind: "not_found"; reason: string }
  | { kind: "ambiguous"; reason: string };

type AssinaturaLookupResult =
  | { kind: "found"; assinatura: AssinaturaRow; via: string }
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
    haystack.includes("cancel")
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
    field: "id" | "checkout_id" | "payment_id" | "email" | "telefone";
    value: string;
    requirePendingRecent?: boolean;
  },
): Promise<LookupResult> {
  let query = supabaseAdmin
    .from("leads_checkout_br")
    .select(
      "id, criado_em, status, email, telefone, nome, plano, valor_centavos, token_id, token_valor, expira_em, utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id, fbclid, campaign_id, adset_id, ad_id, checkout_id, payment_id",
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
      .eq("status", "pendente")
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

async function queryUniqueAssinatura(
  supabaseAdmin: any,
  {
    field,
    value,
  }: {
    field: "lead_id" | "checkout_id" | "payment_id";
    value: string;
  },
): Promise<AssinaturaLookupResult> {
  const { data, error } = await supabaseAdmin
    .from("assinaturas_br")
    .select("id, lead_id, checkout_id, payment_id, status, status_pagamento")
    .eq(field, value)
    .order("criado_em", { ascending: false })
    .limit(2);

  if (error) {
    console.error("[webhook-cakto] assinatura lookup error", {
      field,
      value,
      error,
    });
    return { kind: "not_found", reason: `${field}:query_error` };
  }

  if (!data || data.length === 0) {
    return { kind: "not_found", reason: `${field}:empty` };
  }

  if (data.length > 1) {
    return { kind: "ambiguous", reason: `${field}:multiple_matches` };
  }

  return {
    kind: "found",
    assinatura: data[0] as AssinaturaRow,
    via: `${field}:${value}`,
  };
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
    extracted.leadId,
    extracted.externalReference,
    extracted.reference,
  ]);

  for (const leadId of directLeadIds) {
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

async function findAssinatura(
  supabaseAdmin: any,
  extracted: {
    leadId: string | null;
    externalReference: string | null;
    reference: string | null;
    checkoutId: string | null;
    orderId: string | null;
    transactionId: string | null;
    paymentId: string | null;
  },
) {
  const leadCandidates = uniqueValues([
    extracted.leadId,
    extracted.externalReference,
    extracted.reference,
  ]);

  for (const leadId of leadCandidates) {
    const match = await queryUniqueAssinatura(supabaseAdmin, {
      field: "lead_id",
      value: leadId,
    });
    if (match.kind !== "not_found") return match;
  }

  const paymentCandidates = uniqueValues([
    extracted.paymentId,
    extracted.transactionId,
  ]);

  for (const paymentId of paymentCandidates) {
    const match = await queryUniqueAssinatura(supabaseAdmin, {
      field: "payment_id",
      value: paymentId,
    });
    if (match.kind !== "not_found") return match;
  }

  const checkoutCandidates = uniqueValues([
    extracted.checkoutId,
    extracted.orderId,
  ]);

  for (const checkoutId of checkoutCandidates) {
    const match = await queryUniqueAssinatura(supabaseAdmin, {
      field: "checkout_id",
      value: checkoutId,
    });
    if (match.kind !== "not_found") return match;
  }

  return { kind: "not_found", reason: "no_existing_assinatura" } as const;
}

function buildLeadUpdatePayload(params: {
  status: "pendente" | "recusada";
  checkoutId: string | null;
  paymentId: string | null;
}) {
  const payload: {
    status: "pendente" | "recusada";
    payment_provider: "cakto";
    updated_at: string;
    payment_id?: string;
    checkout_id?: string;
  } = {
    status: params.status,
    payment_provider: "cakto",
    updated_at: new Date().toISOString(),
  };

  if (params.paymentId) payload.payment_id = params.paymentId;
  if (params.checkoutId) payload.checkout_id = params.checkoutId;

  return payload;
}

function buildAssinaturaInsertFromLead(params: {
  lead: LeadRow;
  checkoutId: string | null;
  paymentId: string | null;
  caktoEventId: string | null;
}) {
  const now = new Date().toISOString();
  const insertPayload: TablesInsert<"assinaturas_br"> = {
    lead_id: params.lead.id,
    nome: params.lead.nome,
    email: params.lead.email,
    telefone: params.lead.telefone,
    plano: params.lead.plano,
    valor_centavos: params.lead.valor_centavos,
    status: "ativa",
    status_pagamento: "concluida",
    payment_provider: "cakto",
    checkout_id: params.checkoutId ?? params.lead.checkout_id,
    payment_id: params.paymentId ?? params.lead.payment_id,
    cakto_event_id: params.caktoEventId,
    token_id: params.lead.token_id,
    token_valor: params.lead.token_valor,
    expira_em: params.lead.expira_em,
    comprado_em: now,
    updated_at: now,
    utm_source: params.lead.utm_source,
    utm_medium: params.lead.utm_medium,
    utm_campaign: params.lead.utm_campaign,
    utm_content: params.lead.utm_content,
    utm_term: params.lead.utm_term,
    utm_id: params.lead.utm_id,
    fbclid: params.lead.fbclid,
    campaign_id: params.lead.campaign_id,
    adset_id: params.lead.adset_id,
    ad_id: params.lead.ad_id,
    canal_fechamento: "checkout",
    tipo_venda: "venda_direta",
  };

  return insertPayload;
}

function buildAssinaturaInsertWithoutLead(params: {
  name: string | null;
  email: string | null;
  phone: string | null;
  plan: "diario" | "mensal" | "trimestral" | "anual" | null;
  valorCentavos: number | null;
  checkoutId: string | null;
  paymentId: string | null;
  caktoEventId: string | null;
}) {
  const now = new Date().toISOString();
  const insertPayload: TablesInsert<"assinaturas_br"> = {
    nome: params.name || "Cliente Cakto",
    email: params.email || "sem-email@cakto.local",
    telefone: params.phone,
    plano: params.plan,
    valor_centavos: params.valorCentavos,
    status: "ativa",
    status_pagamento: "concluida",
    payment_provider: "cakto",
    checkout_id: params.checkoutId,
    payment_id: params.paymentId,
    cakto_event_id: params.caktoEventId,
    comprado_em: now,
    updated_at: now,
    canal_fechamento: "checkout",
    tipo_venda: "venda_direta_sem_lead",
    observacao_atribuicao: "assinatura criada sem lead original encontrado",
  };

  return insertPayload;
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
          console.log(
            "[webhook-cakto] payload received:",
            JSON.stringify(payload, null, 2),
          );

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

          const eventType = resolveWebhookEvent(rawEvent, rawStatus);
          const resolvedPaymentId = paymentId || transactionId || orderId;
          const resolvedCheckoutId = checkoutId || orderId;
          const resolvedPlan = normalizePlan(product);
          const valorCentavos =
            parseValorCentavos(
              firstValue(payload, [
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
            email,
            phone,
            name,
            orderId,
            transactionId,
            paymentId,
            checkoutId,
            leadId,
            externalReference,
            reference,
            caktoEventId,
            product,
            resolvedPlan,
            valorCentavos,
          });

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const assinaturaLookup = await findAssinatura(supabaseAdmin, {
            leadId,
            externalReference,
            reference,
            checkoutId,
            orderId,
            transactionId,
            paymentId,
          });

          if (eventType === "refund" || eventType === "chargeback") {
            if (assinaturaLookup.kind !== "found") {
              console.warn("[webhook-cakto] assinatura refund/chargeback not updated", assinaturaLookup);
              return new Response("ok", { status: 200 });
            }

            const refundStatus =
              eventType === "chargeback" ? "chargeback" : "reembolsada";

            const { error: assinaturaUpdateError } = await supabaseAdmin
              .from("assinaturas_br")
              .update({
                status: refundStatus,
                status_pagamento: refundStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", assinaturaLookup.assinatura.id);

            if (assinaturaUpdateError) {
              console.error("[webhook-cakto] assinatura refund/chargeback update error", {
                assinaturaId: assinaturaLookup.assinatura.id,
                assinaturaUpdateError,
              });
            }

            return new Response("ok", { status: 200 });
          }

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

          if (
            eventType === "pix_gerado" ||
            eventType === "checkout_abandonment" ||
            eventType === "purchase_refused"
          ) {
            if (lookup.kind !== "found") {
              console.warn("[webhook-cakto] no lead found for non-approved event", {
                eventType,
                lookup,
              });
              return new Response("ok", { status: 200 });
            }

            const leadStatus =
              eventType === "purchase_refused" ? "recusada" : "pendente";

            const { error: updateError } = await supabaseAdmin
              .from("leads_checkout_br")
              .update(
                buildLeadUpdatePayload({
                  status: leadStatus,
                  checkoutId: resolvedCheckoutId,
                  paymentId: resolvedPaymentId,
                }),
              )
              .eq("id", lookup.lead.id);

            if (updateError) {
              console.error("[webhook-cakto] lead update error", {
                leadId: lookup.lead.id,
                eventType,
                updateError,
              });
            }

            return new Response("ok", { status: 200 });
          }

          if (assinaturaLookup.kind === "ambiguous") {
            console.warn("[webhook-cakto] ambiguous assinatura match", assinaturaLookup);
            return new Response("ok", { status: 200 });
          }

          if (lookup.kind === "found") {
            if (assinaturaLookup.kind === "found") {
              const { error: assinaturaUpdateError } = await supabaseAdmin
                .from("assinaturas_br")
                .update({
                  status: "ativa",
                  status_pagamento: "concluida",
                  payment_provider: "cakto",
                  payment_id: resolvedPaymentId ?? undefined,
                  checkout_id: resolvedCheckoutId ?? undefined,
                  cakto_event_id: caktoEventId ?? undefined,
                  comprado_em: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", assinaturaLookup.assinatura.id);

              if (assinaturaUpdateError) {
                console.error("[webhook-cakto] existing assinatura update error", {
                  assinaturaId: assinaturaLookup.assinatura.id,
                  assinaturaUpdateError,
                });
                return new Response("ok", { status: 200 });
              }
            } else {
              const { error: insertError } = await supabaseAdmin
                .from("assinaturas_br")
                .insert(
                  buildAssinaturaInsertFromLead({
                    lead: lookup.lead,
                    checkoutId: resolvedCheckoutId,
                    paymentId: resolvedPaymentId,
                    caktoEventId,
                  }),
                );

              if (insertError) {
                console.error("[webhook-cakto] assinatura insert error", {
                  leadId: lookup.lead.id,
                  via: lookup.via,
                  insertError,
                });
                return new Response("ok", { status: 200 });
              }
            }

            const { error: deleteError } = await supabaseAdmin
              .from("leads_checkout_br")
              .delete()
              .eq("id", lookup.lead.id);

            if (deleteError) {
              console.error("[webhook-cakto] lead delete error after assinatura insert", {
                leadId: lookup.lead.id,
                deleteError,
              });
            }

            return new Response("ok", { status: 200 });
          }

          if (assinaturaLookup.kind === "found") {
            const { error: assinaturaUpdateError } = await supabaseAdmin
              .from("assinaturas_br")
              .update({
                status: "ativa",
                status_pagamento: "concluida",
                payment_provider: "cakto",
                payment_id: resolvedPaymentId ?? undefined,
                checkout_id: resolvedCheckoutId ?? undefined,
                cakto_event_id: caktoEventId ?? undefined,
                updated_at: new Date().toISOString(),
              })
              .eq("id", assinaturaLookup.assinatura.id);

            if (assinaturaUpdateError) {
              console.error("[webhook-cakto] approved assinatura update without lead error", {
                assinaturaId: assinaturaLookup.assinatura.id,
                assinaturaUpdateError,
              });
            }

            return new Response("ok", { status: 200 });
          }

          const payloadInsert = buildAssinaturaInsertWithoutLead({
            name,
            email,
            phone,
            plan: resolvedPlan,
            valorCentavos,
            checkoutId: resolvedCheckoutId,
            paymentId: resolvedPaymentId,
            caktoEventId,
          });

          const { error: insertWithoutLeadError } = await supabaseAdmin
            .from("assinaturas_br")
            .insert(payloadInsert);

          if (insertWithoutLeadError) {
            console.error("[webhook-cakto] assinatura insert without lead error", {
              insertWithoutLeadError,
              payloadInsert,
            });
          }

          return new Response("ok", { status: 200 });
        } catch (error) {
          console.error("[webhook-cakto] handler error", error);
          return new Response("ok", { status: 200 });
        }
      },
    },
  },
});
