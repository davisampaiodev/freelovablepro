import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TrackingMetadata = {
  fbp?: string | null;
  fbc?: string | null;
  src?: string | null;
  sck?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
};

type PaymentMetadata = {
  fbp?: string | null;
  fbc?: string | null;
  tracking?: TrackingMetadata | null;
};

type MercadoPagoWebhookPayload = {
  action?: string;
  type?: string;
  topic?: string;
  live_mode?: boolean;
  resource?: string | number;
  data?: {
    id?: string | number;
  };
};

type MercadoPagoPayment = {
  id?: string | number;
  collector_id?: string | number;
  status?: string;
  external_reference?: string | null;
  transaction_amount?: number | null;
  date_created?: string | null;
  date_approved?: string | null;
  payment_method_id?: string | null;
  payment_type_id?: string | null;
  live_mode?: boolean;
  description?: string | null;
  metadata?: PaymentMetadata | null;
  payer?: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone?: {
      number?: string | null;
    } | null;
    identification?: {
      number?: string | null;
    } | null;
  } | null;
  additional_info?: {
    payer?: {
      first_name?: string | null;
      last_name?: string | null;
      phone?: {
        number?: string | null;
      } | null;
    } | null;
    items?: Array<{
      title?: string | null;
    }> | null;
  } | null;
};

type LicenseRow = {
  id: string;
  license_key: string;
  status: string | null;
  duration_days: number | null;
  value: number | null;
  client_name: string | null;
  whatsapp: string | null;
  client_email: string | null;
  created_by: string | null;
};

type CheckoutSessionRow = {
  id: string;
  external_reference: string;
  payment_id: string | null;
  plan: string | null;
  duration_days: number | null;
  value: number | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_whatsapp: string | null;
  reseller_id: string | null;
  status: string | null;
  metadata?: PaymentMetadata | null;
  fbp?: string | null;
  fbc?: string | null;
  client_ip_address?: string | null;
  client_user_agent?: string | null;
};

type MetaPurchasePayload = {
  eventId: string;
  value: number | null;
  currency: string;
  eventTime: number;
  eventSourceUrl: string;
  clientEmail?: string | null;
  whatsapp?: string | null;
  clientName?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  externalId?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
};

type MetaResult = {
  sent: boolean;
  skipped: boolean;
  reason: string;
  eventsReceived?: number;
  response?: unknown;
};

type UtmifyDeliveryRow = {
  id: string;
  order_id: string;
  status: "processing" | "sent" | "failed";
  attempts: number;
  updated_at: string;
};

type UtmifyTracking = {
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function env(name: string, fallback = "") {
  return Deno.env.get(name) ?? fallback;
}

function normalizeEvent(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeDigits(value: unknown) {
  return String(value || "").replace(/\D+/g, "").trim();
}

function normalizeMetaPhone(value: unknown) {
  let phone = normalizeDigits(value);

  if (!phone) return "";

  if ((phone.length === 10 || phone.length === 11) && !phone.startsWith("55")) {
    phone = `55${phone}`;
  }

  return phone;
}

function parseNumberMap(raw: string): Record<string, number> {
  if (!raw.trim()) return {};

  try {
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const output: Record<string, number> = {};

    for (const [key, value] of Object.entries(parsed)) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        output[String(key)] = number;
      }
    }

    return output;
  } catch {
    return {};
  }
}

function parseStringMap(raw: string): Record<string, string> {
  if (!raw.trim()) return {};

  try {
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const output: Record<string, string> = {};

    for (const [key, value] of Object.entries(parsed)) {
      const stringValue = String(value || "").trim();

      if (stringValue) {
        output[String(key)] = stringValue;
      }
    }

    return output;
  } catch {
    return {};
  }
}

async function generateDeterministicLicenseKey(source: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(source),
  );

  const bytes = new Uint8Array(digest);
  let output = "";

  for (let index = 0; index < 20; index++) {
    output += alphabet[bytes[index] % alphabet.length];

    if ((index + 1) % 5 === 0 && index < 19) {
      output += "-";
    }
  }

  return output;
}

function extractPaymentId(
  payload: MercadoPagoWebhookPayload,
  request: Request,
) {
  const directDataId = String(payload.data?.id || "").trim();

  if (directDataId) {
    return directDataId;
  }

  const resource = String(payload.resource || "").trim();

  if (resource) {
    if (/^\d+$/.test(resource)) {
      return resource;
    }

    const paymentMatch = resource.match(/\/payments\/(\d+)/i);

    if (paymentMatch?.[1]) {
      return paymentMatch[1];
    }
  }

  const url = new URL(request.url);

  return String(
    url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      "",
  ).trim();
}

async function verifyWebhookSignature(
  _request: Request,
  _dataId: string,
) {
  return {
    ok: true,
    skipped: true,
    reason: "signature_validation_disabled",
  };
}

async function fetchPayment(paymentId: string) {
  const accessToken = env("MP_V2_ACCESS_TOKEN").trim();

  if (!accessToken) {
    throw new Error("MP_V2_ACCESS_TOKEN não configurado.");
  }

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Falha ao consultar pagamento: ${response.status} ${text}`,
    );
  }

  return JSON.parse(text) as MercadoPagoPayment;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sendMetaPurchaseEvent(
  params: MetaPurchasePayload,
): Promise<MetaResult> {
  const pixelId = env("MP_V2_FACEBOOK_PIXEL_ID").trim();
  const accessToken = env("MP_V2_FACEBOOK_ACCESS_TOKEN").trim();
  const graphVersion = env(
    "MP_V2_FACEBOOK_GRAPH_VERSION",
    "v23.0",
  ).trim();

  if (!pixelId) {
    return {
      sent: false,
      skipped: true,
      reason: "missing_pixel_id",
    };
  }

  if (!accessToken) {
    return {
      sent: false,
      skipped: true,
      reason: "missing_access_token",
    };
  }

  if (!params.eventId) {
    return {
      sent: false,
      skipped: true,
      reason: "missing_event_id",
    };
  }

  const fbp = String(
    params.fbp || "",
  ).trim();

  const fbc = String(
    params.fbc || "",
  ).trim();

  if (!fbp) {
    return {
      sent: false,
      skipped: true,
      reason: "missing_fbp",
    };
  }

  if (!fbc) {
    return {
      sent: false,
      skipped: true,
      reason: "missing_fbc",
    };
  }

  const userData: Record<string, unknown> = {};

  const email = String(params.clientEmail || "")
    .trim()
    .toLowerCase();

  const phone = normalizeMetaPhone(params.whatsapp);

  const nameParts = String(params.clientName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstName = String(nameParts.shift() || "")
    .trim()
    .toLowerCase();

  const lastName = String(nameParts.join(" ") || "")
    .trim()
    .toLowerCase();

  const externalId = String(
    params.externalId || "",
  ).trim();

  const clientIpAddress = String(
    params.clientIpAddress || "",
  ).trim();

  const clientUserAgent = String(
    params.clientUserAgent || "",
  ).trim();

  if (email) {
    userData.em = [await sha256Hex(email)];
  }

  if (phone) {
    userData.ph = [await sha256Hex(phone)];
  }

  if (firstName) {
    userData.fn = [await sha256Hex(firstName)];
  }

  if (lastName) {
    userData.ln = [await sha256Hex(lastName)];
  }

  if (externalId) {
    userData.external_id = [
      await sha256Hex(externalId),
    ];
  }

  userData.fbp = fbp;
  userData.fbc = fbc;

  if (clientIpAddress) {
    userData.client_ip_address =
      clientIpAddress;
  }

  if (clientUserAgent) {
    userData.client_user_agent =
      clientUserAgent;
  }

  if (Object.keys(userData).length === 0) {
    return {
      sent: false,
      skipped: true,
      reason: "missing_user_data",
    };
  }

  const value = Number(params.value);

  if (!Number.isFinite(value) || value <= 0) {
    return {
      sent: false,
      skipped: true,
      reason: "invalid_purchase_value",
    };
  }

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: params.eventTime,
        event_id: params.eventId,
        action_source: "website",
        event_source_url: params.eventSourceUrl,
        user_data: userData,
        custom_data: {
          currency: params.currency || "BRL",
          value,
          content_type: "product",
          order_id: params.eventId,
        },
      },
    ],
  };

  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const responseText = await response.text().catch(() => "");
  let responseData: Record<string, unknown> = {};

  try {
    responseData = responseText
      ? JSON.parse(responseText)
      : {};
  } catch {
    responseData = {
      raw_response: responseText,
    };
  }

  if (!response.ok) {
    throw new Error(
      `Meta retornou HTTP ${response.status}: ${JSON.stringify(responseData)}`,
    );
  }

  const eventsReceived = Number(responseData.events_received || 0);

  if (eventsReceived !== 1) {
    throw new Error(
      `Meta não confirmou o Purchase. Resposta: ${JSON.stringify(responseData)}`,
    );
  }

  return {
    sent: true,
    skipped: false,
    reason: "",
    eventsReceived,
    response: responseData,
  };
}

function formatUtmifyDate(value: string | null | undefined) {
  const timestamp = value ? new Date(value).getTime() : Date.now();
  const date = new Date(Number.isFinite(timestamp) ? timestamp : Date.now());
  return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
}

function resolveUtmifyPaymentMethod(payment: MercadoPagoPayment) {
  const method = normalizeEvent(payment.payment_method_id);
  const type = normalizeEvent(payment.payment_type_id);

  if (method === "pix") return "pix";
  if (method === "paypal") return "paypal";
  if (type === "ticket" || type === "atm") return "boleto";
  if (type === "credit_card" || type === "debit_card") {
    return "credit_card";
  }

  return "free_price";
}

function resolveUtmifyTracking(
  payment: MercadoPagoPayment,
): UtmifyTracking {
  const tracking = payment.metadata?.tracking;
  const normalize = (value: unknown) =>
    String(value || "").trim() || null;

  return {
    src: normalize(tracking?.src),
    sck: normalize(tracking?.sck),
    utm_source: normalize(tracking?.utm_source),
    utm_campaign: normalize(tracking?.utm_campaign),
    utm_medium: normalize(tracking?.utm_medium),
    utm_content: normalize(tracking?.utm_content),
    utm_term: normalize(tracking?.utm_term),
  };
}

async function claimUtmifyDelivery(
  supabaseAdmin: ReturnType<typeof createClient>,
  orderId: string,
) {
  const now = new Date().toISOString();
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("utmify_deliveries")
    .insert([{
      order_id: orderId,
      status: "processing",
      attempts: 1,
      updated_at: now,
    }])
    .select("id,order_id,status,attempts,updated_at")
    .maybeSingle<UtmifyDeliveryRow>();

  if (inserted && !insertError) {
    return { claimed: true, alreadySent: false, row: inserted };
  }

  if (insertError?.code !== "23505") {
    throw new Error(
      `Falha ao reservar entrega UTMify: ${insertError?.message || "unknown"}`,
    );
  }

  const { data: existing, error: selectError } = await supabaseAdmin
    .from("utmify_deliveries")
    .select("id,order_id,status,attempts,updated_at")
    .eq("order_id", orderId)
    .maybeSingle<UtmifyDeliveryRow>();

  if (selectError || !existing) {
    throw new Error(
      `Falha ao consultar entrega UTMify: ${selectError?.message || "not_found"}`,
    );
  }

  if (existing.status === "sent") {
    return { claimed: false, alreadySent: true, row: existing };
  }

  const staleBefore = Date.now() - 10 * 60 * 1000;
  const isStale =
    existing.status === "processing" &&
    new Date(existing.updated_at).getTime() < staleBefore;

  if (existing.status !== "failed" && !isStale) {
    return { claimed: false, alreadySent: false, row: existing };
  }

  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("utmify_deliveries")
    .update({
      status: "processing",
      attempts: Number(existing.attempts || 0) + 1,
      last_error: null,
      updated_at: now,
    })
    .eq("id", existing.id)
    .eq("status", existing.status)
    .eq("updated_at", existing.updated_at)
    .select("id,order_id,status,attempts,updated_at")
    .maybeSingle<UtmifyDeliveryRow>();

  if (claimError) {
    throw new Error(`Falha ao retomar entrega UTMify: ${claimError.message}`);
  }

  return {
    claimed: Boolean(claimed),
    alreadySent: false,
    row: claimed || existing,
  };
}

async function sendUtmifyPurchase(params: {
  supabaseAdmin: ReturnType<typeof createClient>;
  payment: MercadoPagoPayment;
  paymentId: string;
  externalReference: string;
  checkoutSession: CheckoutSessionRow | null;
  clientName: string;
  clientEmail: string;
  whatsapp: string | null;
  clientIpAddress: string;
  productName: string;
  value: number;
}) {
  const apiToken = env("UTMIFY_API_TOKEN").trim();
  if (!apiToken) {
    throw new Error("UTMIFY_API_TOKEN não configurado.");
  }

  const orderId = `mp_${params.paymentId}`;
  const claim = await claimUtmifyDelivery(
    params.supabaseAdmin,
    orderId,
  );

  if (claim.alreadySent) {
    return { sent: false, duplicate: true, orderId };
  }

  if (!claim.claimed) {
    throw new Error("Entrega UTMify já está em processamento.");
  }

  const totalPriceInCents = Math.round(params.value * 100);
  const trackingParameters = resolveUtmifyTracking(params.payment);
  const payload = {
    orderId,
    platform: "Mercado Pago",
    paymentMethod: resolveUtmifyPaymentMethod(params.payment),
    status: "paid",
    createdAt: formatUtmifyDate(
      params.payment.date_created || params.payment.date_approved,
    ),
    approvedDate: formatUtmifyDate(params.payment.date_approved),
    refundedAt: null,
    customer: {
      name: params.clientName,
      email: params.clientEmail,
      phone: params.whatsapp,
      document: String(
        params.payment.payer?.identification?.number || "",
      ).trim() || null,
      country: "BR",
      ip: params.clientIpAddress || undefined,
    },
    products: [{
      id:
        params.checkoutSession?.plan ||
        params.externalReference ||
        orderId,
      name: params.productName,
      planId: params.checkoutSession?.plan || null,
      planName: params.productName,
      quantity: 1,
      priceInCents: totalPriceInCents,
    }],
    trackingParameters,
    commission: {
      totalPriceInCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: totalPriceInCents,
      currency: "BRL",
    },
    isTest: params.payment.live_mode === false,
  };

  try {
    const response = await fetch(
      "https://api.utmify.com.br/api-credentials/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-token": apiToken,
          "x-idempotency-key": `utmify:${orderId}`,
        },
        body: JSON.stringify(payload),
      },
    );
    const responseText = await response.text().catch(() => "");

    if (!response.ok) {
      throw new Error(
        `UTMify HTTP ${response.status}: ${responseText.slice(0, 500)}`,
      );
    }

    const { error: sentError } = await params.supabaseAdmin
      .from("utmify_deliveries")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", claim.row.id)
      .eq("status", "processing");

    if (sentError) {
      throw new Error(
        `UTMify confirmou, mas o registro falhou: ${sentError.message}`,
      );
    }

    return { sent: true, duplicate: false, orderId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    await params.supabaseAdmin
      .from("utmify_deliveries")
      .update({
        status: "failed",
        last_error: message.slice(0, 1000),
        updated_at: new Date().toISOString(),
      })
      .eq("id", claim.row.id)
      .eq("status", "processing");

    throw error;
  }
}

async function sendLicenseEmail(params: {
  to: string;
  clientName: string;
  licenseKey: string;
  durationDays: number;
  productName: string;
}) {
  const resendApiKey = env("RESEND_API_KEY");
  const fromEmail = env("RESEND_FROM_EMAIL");

  if (!resendApiKey || !fromEmail || !params.to) {
    return {
      sent: false,
      skipped: true,
    };
  }

  const safeName = params.clientName || "Cliente";

  const subject =
    "Extensão FreeLovable - Sua compra foi aprovada!";

  const html = [
    `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">`,
    `<h2>Extensão FreeLovable - Sua compra foi aprovada!</h2>`,
    `<p>Olá, ${safeName}!</p>`,
    `<p>Sua chave de acesso foi criada com sucesso.</p>`,
    `<p><strong>Produto:</strong> ${params.productName}</p>`,
    `<p><strong>Chave:</strong> ${params.licenseKey}</p>`,
    `<p><strong>Duração:</strong> ${params.durationDays} dia(s).</p>`,
    `<p><a href="https://dxqkzcyzlsnzhqlfybwu.supabase.co/storage/v1/object/public/anexos/FreeLovable%203.7.zip" target="_blank" rel="noopener noreferrer">Clique aqui para baixar a extensão.</a></p>`,
    `<p><strong>Instruções de instalação:</strong></p>`,
    `<ol>`,
    `<li>Baixe a extensão.</li>`,
    `<li>Extraia a pasta.</li>`,
    `<li>Abra o navegador Chrome, Brave ou Edge.</li>`,
    `<li>Entre no menu de extensões.</li>`,
    `<li>Ative o modo Desenvolvedor.</li>`,
    `<li>Clique em Carregar sem compactação e selecione a pasta da extensão.</li>`,
    `<li>Clique no ícone da extensão e insira a chave de licença: <strong>${params.licenseKey}</strong>.</li>`,
    `<li>Abra o Lovable, abra o projeto e atualize a página com a extensão aberta.</li>`,
    `<li>Verifique se o projeto sincronizou com a extensão.</li>`,
    `</ol>`,
    `<p><strong>ATENÇÃO!</strong> Para que a extensão funcione perfeitamente, é necessário ter ao menos 0,1 créditos na conta do Lovable.</p>`,
    `<p>Em caso de dúvida, entre em contato pelo Telegram: <strong>@freelovableoficial</strong> ou WhatsApp: <strong>(71) 9 9115-6578</strong>.</p>`,
    `</div>`,
  ].join("");

  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.to],
        subject,
        html,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");

    throw new Error(
      `Falha ao enviar e-mail: ${response.status} ${text}`,
    );
  }

  return {
    sent: true,
    skipped: false,
  };
}

function resolveTracking(
  payment: MercadoPagoPayment,
  checkoutSession: CheckoutSessionRow | null,
) {
  const checkoutMetadata = checkoutSession?.metadata;
  const paymentMetadata = payment.metadata;

  const fbp = String(
    checkoutSession?.fbp ||
      checkoutMetadata?.fbp ||
      checkoutMetadata?.tracking?.fbp ||
      paymentMetadata?.fbp ||
      paymentMetadata?.tracking?.fbp ||
      "",
  ).trim();

  const fbc = String(
    checkoutSession?.fbc ||
      checkoutMetadata?.fbc ||
      checkoutMetadata?.tracking?.fbc ||
      paymentMetadata?.fbc ||
      paymentMetadata?.tracking?.fbc ||
      "",
  ).trim();

  return {
    fbp: fbp || null,
    fbc: fbc || null,
  };
}

function resolveApprovedEventTime(payment: MercadoPagoPayment) {
  if (payment.date_approved) {
    const timestamp = new Date(payment.date_approved).getTime();

    if (Number.isFinite(timestamp)) {
      return Math.floor(timestamp / 1000);
    }
  }

  return Math.floor(Date.now() / 1000);
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return json(
      {
        success: false,
        error: "Método não permitido",
      },
      405,
    );
  }

  try {
    const webhookPayload =
      await request.json() as MercadoPagoWebhookPayload;

    console.log(
      "mercadopago-v2 payload:",
      JSON.stringify(webhookPayload),
    );

    const eventType = normalizeEvent(
      webhookPayload.type || webhookPayload.topic,
    );

    const action = normalizeEvent(webhookPayload.action);

    if (eventType === "merchant_order") {
      return json({
        success: true,
        ignored: true,
        reason: "event_not_supported",
        eventType,
        action,
      });
    }

    const dataId = extractPaymentId(
      webhookPayload,
      request,
    );

    if (!dataId) {
      return json(
        {
          success: false,
          error: "payment_id ausente",
        },
        400,
      );
    }

    if (eventType && eventType !== "payment") {
      return json({
        success: true,
        ignored: true,
        reason: "event_not_supported",
        eventType,
        action,
      });
    }

    const signature = await verifyWebhookSignature(
      request,
      dataId,
    );

    if (!signature.ok) {
      return json(
        {
          success: false,
          error: "Assinatura inválida",
          reason: signature.reason,
        },
        401,
      );
    }

    const supabaseUrl = env("SUPABASE_URL");
    const supabaseKey = env("SUPABASE_SERVICE_ROLE_KEY");
    const fallbackResellerId = env("MP_V2_RESELLER_ID");

    const defaultDurationDays = Number(
      env("MP_V2_DEFAULT_DURATION_DAYS", "30"),
    );

    const defaultValue = Number(
      env("MP_V2_DEFAULT_VALUE"),
    );

    const durationMap = parseNumberMap(
      env("MP_V2_DURATION_MAP"),
    );

    const valueMap = parseNumberMap(
      env("MP_V2_VALUE_MAP"),
    );

    const resellerMap = parseStringMap(
      env("MP_V2_RESELLER_MAP"),
    );

    if (!supabaseUrl || !supabaseKey) {
      return json(
        {
          success: false,
          error: "Ambiente não configurado",
        },
        500,
      );
    }

    const payment = await fetchPayment(dataId);
    const paymentStatus = normalizeEvent(payment.status);
    const paymentId = String(payment.id || dataId).trim();
    const collectorId = String(payment.collector_id || "").trim();

    const configuredResellerId =
      resellerMap[collectorId] || fallbackResellerId;

    console.log(
      "mercadopago-v2 payment:",
      JSON.stringify({
        payment_id: paymentId,
        collector_id: collectorId,
        status: payment.status || "",
        external_reference: payment.external_reference || "",
        transaction_amount: payment.transaction_amount ?? null,
        date_approved: payment.date_approved || "",
        payer_email: payment.payer?.email || "",
      }),
    );

    if (!configuredResellerId) {
      throw new Error(
        `Reseller não configurado para collector_id ${collectorId}`,
      );
    }

    const externalReference = String(
      payment.external_reference || "",
    ).trim();

    const metaEventId = `mp_${paymentId}`;

    const amountFromPayment = Number(
      payment.transaction_amount,
    );

    const durationDays = Number.isFinite(
      durationMap[externalReference],
    )
      ? durationMap[externalReference]
      : Number.isFinite(defaultDurationDays)
        ? defaultDurationDays
        : 30;

    const value = Number.isFinite(
      valueMap[externalReference],
    )
      ? valueMap[externalReference]
      : Number.isFinite(amountFromPayment)
        ? amountFromPayment
        : Number.isFinite(defaultValue)
          ? defaultValue
          : null;

    const payer = payment.payer || {};
    const additionalPayer =
      payment.additional_info?.payer || {};

    const clientEmail = String(
      payer.email || "",
    ).trim();

    const clientName = String(
      `${String(
        additionalPayer.first_name ||
          payer.first_name ||
          "",
      ).trim()} ${String(
        additionalPayer.last_name ||
          payer.last_name ||
          "",
      ).trim()}`.trim() || "Cliente",
    ).trim();

    const whatsapp =
      normalizeDigits(
        additionalPayer.phone?.number ||
          payer.phone?.number ||
          "",
      ) || null;

    const productName = String(
      payment.additional_info?.items?.[0]?.title ||
        payment.description ||
        externalReference ||
        "FreeLovable",
    ).trim();

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: false,
        },
      },
    );

    const { data: checkoutSession, error: checkoutError } =
      await supabaseAdmin
        .from("checkout_sessions_v2")
        .select("*")
        .eq("provider", "mercadopago")
        .eq("external_reference", externalReference)
        .maybeSingle<CheckoutSessionRow>();

    if (checkoutError) {
      console.error(
        "mercadopago-v2 checkout session error:",
        checkoutError,
      );
    }

    if (checkoutSession?.id) {
      const checkoutUpdatePayload: Record<string, unknown> = {
        payment_id: paymentId,
        status: payment.status || "",
      };

      if (paymentStatus === "approved") {
        checkoutUpdatePayload.processed_at =
          new Date().toISOString();
      }

      const { error: updateError } = await supabaseAdmin
        .from("checkout_sessions_v2")
        .update(checkoutUpdatePayload)
        .eq("id", checkoutSession.id);

      if (updateError) {
        console.error(
          "mercadopago-v2 checkout update error:",
          updateError,
        );
      }
    }

    if (paymentStatus !== "approved") {
      return json({
        success: true,
        ignored: true,
        reason: "payment_not_approved",
        payment_id: paymentId,
        status: payment.status || "",
        external_reference: externalReference,
      });
    }

    const resolvedResellerId =
      checkoutSession?.reseller_id ||
      configuredResellerId;

    const resolvedDurationDays = Number.isFinite(
      Number(checkoutSession?.duration_days),
    )
      ? Number(checkoutSession?.duration_days)
      : durationDays;

    const resolvedValue = Number.isFinite(
      Number(checkoutSession?.value),
    )
      ? Number(checkoutSession?.value)
      : value;

    const resolvedClientEmail = String(
      checkoutSession?.customer_email ||
        clientEmail ||
        "",
    ).trim();

    const resolvedClientName = String(
      checkoutSession?.customer_name ||
        clientName ||
        "Cliente",
    ).trim();

    const resolvedWhatsapp =
      normalizeDigits(
        checkoutSession?.customer_whatsapp ||
          whatsapp ||
          "",
      ) || null;

    if (!resolvedResellerId) {
      throw new Error(
        "Reseller não configurado para esta venda",
      );
    }

    const deterministicLicenseKey =
      await generateDeterministicLicenseKey(
        `mercadopago:${paymentId}`,
      );

    const { data: existingLicense, error: existingLicenseError } =
      await supabaseAdmin
        .from("licenses")
        .select("*")
        .eq("license_key", deterministicLicenseKey)
        .maybeSingle<LicenseRow>();

    if (existingLicenseError) {
      throw new Error(
        `Falha ao consultar licença: ${existingLicenseError.message}`,
      );
    }

    let license: LicenseRow | null = existingLicense;
    let licenseCreated = false;

    if (!license) {
      const insertPayload = {
        license_key: deterministicLicenseKey,
        status: "active",
        duration_days: Number.isFinite(resolvedDurationDays)
          ? resolvedDurationDays
          : null,
        value: Number.isFinite(Number(resolvedValue))
          ? Number(resolvedValue)
          : null,
        client_name: resolvedClientName || null,
        whatsapp: resolvedWhatsapp,
        client_email: resolvedClientEmail || null,
        created_by: resolvedResellerId,
      };

      const { data: insertedLicense, error: insertError } =
        await supabaseAdmin
          .from("licenses")
          .insert([insertPayload])
          .select("*")
          .single<LicenseRow>();

      if (insertError || !insertedLicense) {
        /*
         * Outra execução pode ter criado a licença
         * simultaneamente. Consultamos novamente antes de falhar.
         */
        const { data: duplicateLicense, error: duplicateError } =
          await supabaseAdmin
            .from("licenses")
            .select("*")
            .eq("license_key", deterministicLicenseKey)
            .maybeSingle<LicenseRow>();

        if (duplicateError || !duplicateLicense) {
          throw new Error(
            insertError?.message ||
              duplicateError?.message ||
              "Falha ao criar licença",
          );
        }

        license = duplicateLicense;
      } else {
        license = insertedLicense;
        licenseCreated = true;
      }
    }

    if (!license) {
      throw new Error(
        "Não foi possível localizar ou criar a licença",
      );
    }

    let emailResult = {
      sent: false,
      skipped: true,
    };

    /*
     * O e-mail só é enviado quando a licença é criada.
     * Reprocessamentos não enviam o e-mail novamente.
     */
    if (licenseCreated) {
      try {
        emailResult = await sendLicenseEmail({
          to: resolvedClientEmail,
          clientName: resolvedClientName,
          licenseKey: license.license_key,
          durationDays: resolvedDurationDays,
          productName,
        });
      } catch (emailError) {
        console.error(
          "mercadopago-v2 email error:",
          emailError,
        );
      }
    }

    const tracking = resolveTracking(
      payment,
      checkoutSession || null,
    );

    const eventTime =
      resolveApprovedEventTime(payment);

    const eventSourceUrl = env(
      "MP_V2_EVENT_SOURCE_URL",
      "https://freelovablepro.com.br/pagamento/aprovado",
    ).trim();

    const externalId = String(
      checkoutSession?.id ||
        externalReference ||
        "",
    ).trim();

    const clientIpAddress = String(
      checkoutSession?.client_ip_address ||
        "",
    ).trim();

    const clientUserAgent = String(
      checkoutSession?.client_user_agent ||
        "",
    ).trim();

    console.log(
      "mercadopago-v2 meta start:",
      JSON.stringify({
        payment_id: paymentId,
        event_id: metaEventId,
        value: resolvedValue,
        currency: "BRL",
        event_time: eventTime,
        fbp_present: Boolean(tracking.fbp),
        fbc_present: Boolean(tracking.fbc),
        external_id_present: Boolean(externalId),
        client_ip_address_present:
          Boolean(clientIpAddress),
        client_user_agent_present:
          Boolean(clientUserAgent),
        license_created: licenseCreated,
      }),
    );

    /*
     * Não há try/catch que engole o erro.
     * Se a Meta falhar, o erro chega ao catch principal
     * e a função responde HTTP 500.
     *
     * Na próxima notificação, a licença será reutilizada,
     * mas o Purchase será tentado novamente.
     */
    const metaResult = await sendMetaPurchaseEvent({
      eventId: metaEventId,
      value: Number.isFinite(Number(resolvedValue))
        ? Number(resolvedValue)
        : null,
      currency: "BRL",
      eventTime,
      eventSourceUrl,
      clientEmail: resolvedClientEmail,
      whatsapp: resolvedWhatsapp,
      clientName: resolvedClientName,
      fbp: tracking.fbp,
      fbc: tracking.fbc,
      externalId,
      clientIpAddress,
      clientUserAgent,
    });

    if (!metaResult.sent) {
      throw new Error(
        `Purchase não enviado para Meta: ${metaResult.reason}`,
      );
    }

    console.log(
      "mercadopago-v2 meta purchase:",
      JSON.stringify({
        payment_id: paymentId,
        event_id: metaEventId,
        sent: metaResult.sent,
        skipped: metaResult.skipped,
        events_received: metaResult.eventsReceived || 0,
      }),
    );

    const numericResolvedValue = Number(resolvedValue);

    if (
      !Number.isFinite(numericResolvedValue) ||
      numericResolvedValue <= 0
    ) {
      throw new Error("Valor inválido para envio à UTMify.");
    }

    const utmifyResult = await sendUtmifyPurchase({
      supabaseAdmin,
      payment,
      paymentId,
      externalReference,
      checkoutSession: checkoutSession || null,
      clientName: resolvedClientName,
      clientEmail: resolvedClientEmail,
      whatsapp: resolvedWhatsapp,
      clientIpAddress,
      productName,
      value: numericResolvedValue,
    });

    console.log(
      "mercadopago-v2 utmify purchase:",
      JSON.stringify({
        payment_id: paymentId,
        order_id: utmifyResult.orderId,
        sent: utmifyResult.sent,
        duplicate: utmifyResult.duplicate,
      }),
    );

    return json({
      success: true,
      duplicate: !licenseCreated,
      payment_id: paymentId,
      payment_status: payment.status || "",
      external_reference: externalReference,
      event_id: metaEventId,
      license_key: license.license_key,
      duration_days: resolvedDurationDays,
      value: resolvedValue,
      client_name: license.client_name,
      email: resolvedClientEmail,
      email_sent: emailResult.sent,
      email_skipped: emailResult.skipped,
      meta_sent: metaResult.sent,
      meta_skipped: metaResult.skipped,
      meta_events_received: metaResult.eventsReceived || 0,
      utmify_sent: utmifyResult.sent,
      utmify_duplicate: utmifyResult.duplicate,
      utmify_order_id: utmifyResult.orderId,
      fbp_present: Boolean(tracking.fbp),
      fbc_present: Boolean(tracking.fbc),
      external_id_present: Boolean(externalId),
      client_ip_address_present:
        Boolean(clientIpAddress),
      client_user_agent_present:
        Boolean(clientUserAgent),
      signature_skipped: signature.skipped,
    });
  } catch (error) {
    console.error(
      "mercadopago-webhook-v2 fatal error:",
      error,
    );

    /*
     * O HTTP 500 é proposital.
     * O Mercado Pago poderá repetir a notificação.
     */
    return json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      500,
    );
  }
});
