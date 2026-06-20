import { createFileRoute } from "@tanstack/react-router";

type LeadRow = {
  id: string;
  criado_em: string;
  status: string;
  email: string;
  telefone: string | null;
  checkout_id: string | null;
  payment_id: string | null;
};

type LookupResult =
  | { kind: "found"; lead: LeadRow; via: string }
  | { kind: "not_found"; reason: string }
  | { kind: "ambiguous"; reason: string };

const APPROVED_STATUSES = new Set([
  "approved",
  "paid",
  "completed",
  "pago",
]);

const REFUSED_STATUSES = new Set([
  "refused",
  "failed",
  "canceled",
  "cancelled",
  "chargeback",
  "refunded",
  "rejected",
  "recusado",
]);

const PENDING_STATUSES = new Set([
  "pending",
  "pendente",
  "waiting_payment",
  "pix_generated",
  "awaiting_payment",
]);

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

function mapStatus(rawStatus: string | null) {
  const normalized = normalizeStatus(rawStatus);
  if (!normalized) return "pendente" as const;

  if (
    APPROVED_STATUSES.has(normalized) ||
    normalized.includes("approved") ||
    normalized.includes("completed") ||
    normalized === "paid"
  ) {
    return "concluida" as const;
  }

  if (
    REFUSED_STATUSES.has(normalized) ||
    normalized.includes("refund") ||
    normalized.includes("cancel") ||
    normalized.includes("fail") ||
    normalized.includes("chargeback")
  ) {
    return "recusada" as const;
  }

  if (
    PENDING_STATUSES.has(normalized) ||
    normalized.includes("pending") ||
    normalized.includes("waiting") ||
    normalized.includes("pix")
  ) {
    return "pendente" as const;
  }

  return "pendente" as const;
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
    .select("id, criado_em, status, email, telefone, checkout_id, payment_id")
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

export const Route = createFileRoute("/api/public/webhook-cakto")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const providedToken = url.searchParams.get("token");
        const expectedToken = process.env.CAKTO_WEBHOOK_SECRET;

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
          const product = firstValue(payload, [
            "plano",
            "produto",
            "product",
            "product_name",
            "offer_name",
            "plan",
          ]);

          const mappedStatus = mapStatus(rawStatus);
          const resolvedPaymentId = paymentId || transactionId || orderId;
          const resolvedCheckoutId = checkoutId || orderId;
          console.log("[webhook-cakto] extracted", {
            rawStatus,
            mappedStatus,
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
            product,
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

          if (lookup.kind !== "found") {
            console.warn("[webhook-cakto] lead not updated", lookup);
            return new Response("ok", { status: 200 });
          }

          const updatePayload: {
            status: "concluida" | "recusada" | "pendente";
            payment_provider: "cakto";
            updated_at: string;
            payment_id?: string;
            checkout_id?: string;
            comprado_em?: string;
          } = {
            status: mappedStatus,
            payment_provider: "cakto",
            updated_at: new Date().toISOString(),
          };

          if (resolvedPaymentId) updatePayload.payment_id = resolvedPaymentId;
          if (resolvedCheckoutId) updatePayload.checkout_id = resolvedCheckoutId;
          if (mappedStatus === "concluida") {
            updatePayload.comprado_em = new Date().toISOString();
          }

          const { error: updateError } = await supabaseAdmin
            .from("leads_checkout_br")
            .update(updatePayload)
            .eq("id", lookup.lead.id);

          if (updateError) {
            console.error("[webhook-cakto] update error", {
              leadId: lookup.lead.id,
              via: lookup.via,
              updateError,
            });
            return new Response("ok", { status: 200 });
          }

          console.log("[webhook-cakto] lead updated", {
            leadId: lookup.lead.id,
            via: lookup.via,
            status: mappedStatus,
            paymentId: resolvedPaymentId,
            checkoutId: resolvedCheckoutId,
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
