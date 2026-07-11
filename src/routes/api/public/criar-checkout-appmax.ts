import { createFileRoute } from "@tanstack/react-router";

type Plano = "diario" | "mensal" | "trimestral" | "anual";

type LeadRow = {
  checkout_id: string | null;
  checkout_url: string | null;
  email: string;
  etapa_funil: string;
  id: string;
  nome: string;
  payment_provider: string | null;
  payment_id: string | null;
  plano: Plano;
  status_pagamento: string;
  telefone: string | null;
  atualizado_em: string;
  campanha: string | null;
  criativo: string | null;
  origem: string | null;
  valor_oferta: number | null;
};

type AppmaxConfig = {
  apiBaseUrl: string;
  authBaseUrl: string;
  clientId: string;
  clientSecret: string;
  createPaymentLinkPath: string;
  missing: string[];
  siteUrl: string;
  webhookSecret: string;
};

const PLANO_CENTAVOS: Record<Plano, number> = {
  diario: 990,
  mensal: 4700,
  trimestral: 9700,
  anual: 19700,
};

const PLANO_LABEL: Record<Plano, string> = {
  diario: "Plano Diario",
  mensal: "Plano Mensal",
  trimestral: "Plano Trimestral",
  anual: "Plano Anual",
};

const PLANOS = new Set<Plano>(["diario", "mensal", "trimestral", "anual"]);
const RECENT_CHECKOUT_WINDOW_MS = 30 * 60 * 1000;

function isPlano(value: unknown): value is Plano {
  return typeof value === "string" && PLANOS.has(value as Plano);
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizePath(value: string) {
  return value.startsWith("/") ? value : `/${value}`;
}

function normalizePhone(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D+/g, "");
  return digits || null;
}

function isRecentAppmaxCheckout(lead: LeadRow) {
  if (
    lead.payment_provider !== "appmax" ||
    !lead.checkout_url ||
    lead.status_pagamento !== "pendente"
  ) {
    return false;
  }

  const updatedAt = new Date(lead.atualizado_em).getTime();
  if (!Number.isFinite(updatedAt)) return false;
  return Date.now() - updatedAt <= RECENT_CHECKOUT_WINDOW_MS;
}

function firstString(input: unknown, keys: string[]) {
  const stack = [input];
  const seen = new WeakSet<object>();
  const targetKeys = new Set(keys.map((key) => key.toLowerCase()));

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (seen.has(current)) continue;
    seen.add(current);

    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }

    for (const [key, value] of Object.entries(current)) {
      if (
        targetKeys.has(key.toLowerCase()) &&
        (typeof value === "string" || typeof value === "number")
      ) {
        const normalized = String(value).trim();
        if (normalized) return normalized;
      }

      if (value && typeof value === "object") {
        stack.push(value);
      }
    }
  }

  return null;
}

async function getAppmaxConfig() {
  const { getServerEnv } = await import("@/lib/config.server");
  const clientId = await getServerEnv("APPMAX_CLIENT_ID");
  const clientSecret = await getServerEnv("APPMAX_CLIENT_SECRET");
  const authBaseUrl = await getServerEnv("APPMAX_AUTH_BASE_URL");
  const apiBaseUrl = await getServerEnv("APPMAX_API_BASE_URL");
  const siteUrl = await getServerEnv("SITE_URL");
  const webhookSecret = await getServerEnv("APPMAX_WEBHOOK_SECRET");
  const createPaymentLinkPath = await getServerEnv(
    "APPMAX_CREATE_PAYMENT_LINK_PATH",
  );

  const missing = [
    ...(!clientId ? ["APPMAX_CLIENT_ID"] : []),
    ...(!clientSecret ? ["APPMAX_CLIENT_SECRET"] : []),
    ...(!authBaseUrl ? ["APPMAX_AUTH_BASE_URL"] : []),
    ...(!apiBaseUrl ? ["APPMAX_API_BASE_URL"] : []),
    ...(!createPaymentLinkPath ? ["APPMAX_CREATE_PAYMENT_LINK_PATH"] : []),
  ];

  return {
    apiBaseUrl,
    authBaseUrl,
    clientId,
    clientSecret,
    createPaymentLinkPath,
    missing,
    siteUrl,
    webhookSecret,
  };
}

function buildWebhookUrl(siteUrl: string, webhookSecret: string) {
  if (!siteUrl || !webhookSecret) return null;
  const url = new URL("/api/public/webhook-appmax", siteUrl);
  url.searchParams.set("token", webhookSecret);
  return url.toString();
}

function buildAppmaxPaymentLinkPayload(
  lead: LeadRow,
  config: { siteUrl: string; webhookSecret: string },
) {
  const valorOferta = lead.valor_oferta ?? PLANO_CENTAVOS[lead.plano] / 100;
  const valorCentavos = Math.round(valorOferta * 100);
  const webhookUrl = buildWebhookUrl(config.siteUrl, config.webhookSecret);

  // Payment link adapter: confirm field names against the real Appmax API docs before production.
  return {
    external_reference: lead.id,
    reference: lead.id,
    metadata: {
      lead_id: lead.id,
      plano: lead.plano,
      utm_source: lead.origem,
      utm_campaign: lead.campanha,
      utm_content: lead.criativo,
    },
    customer: {
      name: lead.nome,
      email: lead.email,
      phone: normalizePhone(lead.telefone),
    },
    items: [
      {
        name: `FreeLovable - ${PLANO_LABEL[lead.plano]}`,
        sku: `freelovable-${lead.plano}`,
        quantity: 1,
        unit_price: valorCentavos,
        amount: valorCentavos,
      },
    ],
    payment_methods: ["pix", "credit_card"],
    amount: valorCentavos,
    currency: "BRL",
    ...(webhookUrl ? { webhook_url: webhookUrl, callback_url: webhookUrl } : {}),
  };
}

async function getAppmaxAccessToken(config: AppmaxConfig) {
  const tokenUrl = `${normalizeBaseUrl(config.authBaseUrl)}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const responseText = await response.text();
  let responseBody: unknown = null;
  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseBody = { raw: responseText.slice(0, 1000) };
  }

  if (!response.ok) {
    console.error("[criar-checkout-appmax] OAuth token error", {
      status: response.status,
      body: responseBody,
    });
    return {
      ok: false as const,
      error: "appmax_auth_failed",
      status: 502,
    };
  }

  const accessToken = firstString(responseBody, ["access_token"]);
  if (!accessToken) {
    console.error("[criar-checkout-appmax] OAuth token missing access_token", {
      body: responseBody,
    });
    return {
      ok: false as const,
      error: "appmax_access_token_missing",
      status: 502,
    };
  }

  return {
    ok: true as const,
    accessToken,
    expiresIn: firstString(responseBody, ["expires_in"]),
    tokenType: firstString(responseBody, ["token_type"]),
  };
}

async function createAppmaxPaymentLink(lead: LeadRow) {
  const config = await getAppmaxConfig();
  if (config.missing.length > 0) {
    return {
      ok: false as const,
      status: 500,
      error: `Missing Appmax environment variable(s): ${config.missing.join(", ")}`,
    };
  }

  const tokenResult = await getAppmaxAccessToken(config);
  if (!tokenResult.ok) {
    return tokenResult;
  }

  const url = `${normalizeBaseUrl(config.apiBaseUrl)}${normalizePath(
    config.createPaymentLinkPath,
  )}`;
  const payload = buildAppmaxPaymentLinkPayload(lead, {
    siteUrl: config.siteUrl,
    webhookSecret: config.webhookSecret,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenResult.accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let responseBody: unknown = null;
  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseBody = { raw: responseText.slice(0, 1000) };
  }

  if (!response.ok) {
    console.error("[criar-checkout-appmax] Appmax payment link API error", {
      status: response.status,
      body: responseBody,
    });
    return {
      ok: false as const,
      status: 502,
      error: "appmax_payment_link_failed",
    };
  }

  const checkoutUrl = firstString(responseBody, [
    "checkout_url",
    "checkoutUrl",
    "payment_url",
    "paymentUrl",
    "payment_link",
    "paymentLink",
    "url",
    "link",
  ]);

  if (!checkoutUrl) {
    console.error(
      "[criar-checkout-appmax] Appmax response missing payment link URL",
      {
        body: responseBody,
      },
    );
    return {
      ok: false as const,
      status: 502,
      error: "appmax_payment_link_url_missing",
    };
  }

  return {
    ok: true as const,
    checkoutId: firstString(responseBody, [
      "id",
      "link_id",
      "linkId",
      "payment_link_id",
      "paymentLinkId",
      "order_id",
      "orderId",
      "checkout_id",
      "checkoutId",
    ]),
    checkoutUrl,
    paymentId: firstString(responseBody, [
      "payment_id",
      "paymentId",
      "transaction_id",
      "transactionId",
      "charge_id",
    ]),
    payload,
  };
}

export const Route = createFileRoute("/api/public/criar-checkout-appmax")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => null);
          const leadId = body && typeof body === "object" ? (body as any).lead_id : null;
          const requestedPlano =
            body && typeof body === "object" ? (body as any).plano : null;

          if (!isUuid(leadId)) {
            return Response.json({ error: "invalid lead_id" }, { status: 400 });
          }

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data: lead, error: lookupError } = await supabaseAdmin
            .from("leads_checkout_br")
            .select(
              "id, nome, email, telefone, plano, status_pagamento, etapa_funil, payment_provider, payment_id, checkout_id, checkout_url, valor_oferta, atualizado_em, origem, campanha, criativo",
            )
            .eq("id", leadId)
            .maybeSingle();

          if (lookupError) {
            console.error("[criar-checkout-appmax] lead lookup error", {
              leadId,
              lookupError,
            });
            return Response.json({ error: "lead lookup failed" }, { status: 500 });
          }

          if (!lead) {
            return Response.json({ error: "lead not found" }, { status: 404 });
          }

          const leadRow = lead as LeadRow;

          if (leadRow.status_pagamento !== "pendente") {
            return Response.json(
              { error: "lead is not pending" },
              { status: 409 },
            );
          }

          if (!isPlano(leadRow.plano)) {
            return Response.json({ error: "invalid lead plan" }, { status: 422 });
          }

          if (requestedPlano && requestedPlano !== leadRow.plano) {
            return Response.json(
              { error: "plan mismatch" },
              { status: 409 },
            );
          }

          if (isRecentAppmaxCheckout(leadRow)) {
            return Response.json({
              checkout_url: leadRow.checkout_url,
              reused: true,
            });
          }

          const appmaxResult = await createAppmaxPaymentLink(leadRow);
          if (!appmaxResult.ok) {
            return Response.json(
              { error: appmaxResult.error },
              { status: appmaxResult.status },
            );
          }

          const now = new Date().toISOString();
          const { error: updateError } = await supabaseAdmin
            .from("leads_checkout_br")
            .update({
              payment_provider: "appmax",
              etapa_funil: "checkout_iniciado",
              checkout_url: appmaxResult.checkoutUrl,
              external_reference: leadRow.id,
              checkout_iniciado_em: now,
              ...(appmaxResult.checkoutId
                ? { checkout_id: appmaxResult.checkoutId }
                : {}),
              ...(appmaxResult.paymentId
                ? { payment_id: appmaxResult.paymentId }
                : {}),
              atualizado_em: now,
            })
            .eq("id", leadRow.id);

          if (updateError) {
            console.error("[criar-checkout-appmax] lead update error", {
              leadId: leadRow.id,
              updateError,
            });
            return Response.json({ error: "lead update failed" }, { status: 500 });
          }

          return Response.json({
            checkout_url: appmaxResult.checkoutUrl,
            reused: false,
          });
        } catch (error) {
          console.error("[criar-checkout-appmax] handler error", error);
          return Response.json({ error: "unexpected error" }, { status: 500 });
        }
      },
    },
  },
});
