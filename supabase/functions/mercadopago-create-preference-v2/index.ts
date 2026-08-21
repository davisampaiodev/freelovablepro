import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

function splitMetaName(value: unknown) {
  if (typeof value !== "string") return { firstName: null, lastName: null };
  const parts = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || null,
    lastName: parts.join(" ") || null,
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Tracking = {
  fbp?: string;
  fbc?: string;
  lead_event_id?: string;
  initiate_checkout_event_id?: string;
  event_source_url?: string;
  src?: string | null;
  sck?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
};

type RequestBody = {
  plan?: string;
  name?: string;
  email?: string;
  whatsapp?: string;
  tracking?: Tracking;
};

type PlanConfig = {
  title: string;
  durationDays: number;
  price: number;
  maxInstallments: number;
};

type MetaEvent = {
  event_name: "Lead" | "InitiateCheckout";
  event_time: number;
  event_id: string;
  action_source: "website";
  event_source_url: string;
  user_data: Record<string, unknown>;
  custom_data: Record<string, unknown>;
};

const PLAN_MAP: Record<string, PlanConfig> = {
  plan_1d: { title: "FreeLovable 1 dia", durationDays: 1, price: 17, maxInstallments: 1 },
  plan_30d: { title: "FreeLovable 30 dias", durationDays: 30, price: 47, maxInstallments: 1 },
  plan_90d: { title: "FreeLovable 90 dias", durationDays: 90, price: 111, maxInstallments: 3 },
  plan_3650d: { title: "FreeLovable Anual", durationDays: 365, price: 324, maxInstallments: 12 },
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function env(name: string, fallback = "") {
  return Deno.env.get(name) ?? fallback;
}

function normalizeDigits(value: unknown) {
  return String(value || "").replace(/\D+/g, "").trim();
}

function normalizeMetaPhone(value: unknown) {
  let phone = normalizeDigits(value);
  if ((phone.length === 10 || phone.length === 11) && !phone.startsWith("55")) {
    phone = `55${phone}`;
  }
  return phone;
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function cleanTrackingValue(value: unknown, maxLength: number) {
  return String(value || "").trim().slice(0, maxLength);
}

function resolveClientIp(request: Request) {
  const cloudflareIp = String(
    request.headers.get("cf-connecting-ip") || "",
  ).trim();

  if (cloudflareIp) {
    return cloudflareIp;
  }

  const forwardedFor = String(
    request.headers.get("x-forwarded-for") || "",
  ).trim();

  if (forwardedFor) {
    return String(
      forwardedFor.split(",")[0] || "",
    ).trim();
  }

  const realIp = String(
    request.headers.get("x-real-ip") || "",
  ).trim();

  return realIp || null;
}

function createExternalReference() {
  return `mp_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
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

async function buildMetaUserData(params: {
  name: string;
  email: string;
  whatsapp: string;
  fbp: string;
  fbc: string;
  externalId: string;
  clientIpAddress: string | null;
  clientUserAgent: string;
}) {
  const userData: Record<string, unknown> = {};
  const { firstName, lastName } = splitMetaName(params.name);
  const phone = normalizeMetaPhone(params.whatsapp);

  if (params.email) userData.em = [await sha256Hex(params.email)];
  if (phone) userData.ph = [await sha256Hex(phone)];
  if (firstName) userData.fn = [await sha256Hex(firstName)];
  if (lastName) userData.ln = [await sha256Hex(lastName)];
  if (params.externalId) {
    userData.external_id = [await sha256Hex(params.externalId)];
  }
  if (params.fbp) userData.fbp = params.fbp;
  if (params.fbc) userData.fbc = params.fbc;
  if (params.clientIpAddress) {
    userData.client_ip_address = params.clientIpAddress;
  }
  if (params.clientUserAgent) {
    userData.client_user_agent = params.clientUserAgent;
  }

  return userData;
}

async function sendMetaCheckoutEvents(events: MetaEvent[]) {
  const pixelId = env("MP_V2_FACEBOOK_PIXEL_ID").trim();
  const accessToken = env("MP_V2_FACEBOOK_ACCESS_TOKEN").trim();
  const graphVersion = env("MP_V2_FACEBOOK_GRAPH_VERSION", "v23.0").trim();

  if (!pixelId || !accessToken) {
    return {
      sent: false,
      skipped: true,
      reason: !pixelId ? "missing_pixel_id" : "missing_access_token",
      eventsReceived: 0,
    };
  }

  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${graphVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: events }),
        },
      );
      const text = await response.text().catch(() => "");
      let result: Record<string, unknown> = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        result = { raw_response: text };
      }

      if (!response.ok) {
        throw new Error(`Meta HTTP ${response.status}: ${JSON.stringify(result)}`);
      }

      const eventsReceived = Number(result.events_received || 0);
      if (eventsReceived !== events.length) {
        throw new Error(
          `Meta confirmou ${eventsReceived}/${events.length} eventos: ${JSON.stringify(result)}`,
        );
      }

      return {
        sent: true,
        skipped: false,
        reason: "",
        eventsReceived,
        response: result,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 350));
      }
    }
  }

  return {
    sent: false,
    skipped: false,
    reason: lastError || "meta_delivery_failed",
    eventsReceived: 0,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ success: false, error: "Método não permitido." }, 405);
  }

  try {
    const accessToken = env("MP_V2_ACCESS_TOKEN").trim();
    const supabaseUrl = env("SUPABASE_URL").trim();
    const supabaseKey = env("SUPABASE_SERVICE_ROLE_KEY").trim();
    const fallbackResellerId = env("MP_V2_RESELLER_ID").trim();

    if (!accessToken) {
      return json({ success: false, error: "MP_V2_ACCESS_TOKEN não configurado." }, 500);
    }
    if (!supabaseUrl || !supabaseKey || !fallbackResellerId) {
      return json({ success: false, error: "Ambiente não configurado." }, 500);
    }

    const body = await req.json() as RequestBody;
    const plan = String(body.plan || "").trim();
    const name = String(body.name || "").trim();
    const email = normalizeEmail(body.email);
    const whatsapp = normalizeDigits(body.whatsapp);
    const selectedPlan = PLAN_MAP[plan];

    if (!selectedPlan) return json({ success: false, error: "Plano inválido." }, 400);
    if (!name) return json({ success: false, error: "Nome obrigatório." }, 400);
    if (!email) return json({ success: false, error: "E-mail obrigatório." }, 400);

    const normalizedFbp = cleanTrackingValue(body.tracking?.fbp, 255);
    const normalizedFbc = cleanTrackingValue(body.tracking?.fbc, 500);
    const utmTracking = {
      src: cleanTrackingValue(body.tracking?.src, 500) || null,
      sck: cleanTrackingValue(body.tracking?.sck, 500) || null,
      utm_source:
        cleanTrackingValue(body.tracking?.utm_source, 500) || null,
      utm_campaign:
        cleanTrackingValue(body.tracking?.utm_campaign, 1000) || null,
      utm_medium:
        cleanTrackingValue(body.tracking?.utm_medium, 1000) || null,
      utm_content:
        cleanTrackingValue(body.tracking?.utm_content, 1000) || null,
      utm_term:
        cleanTrackingValue(body.tracking?.utm_term, 1000) || null,
    };
    const clientIpAddress = resolveClientIp(req);
    const clientUserAgent = String(
      req.headers.get("user-agent") || "",
    ).trim();

    console.log(
      "mercadopago-create-preference-v2 tracking:",
      JSON.stringify({
        fbp_present: Boolean(normalizedFbp),
        fbc_present: Boolean(normalizedFbc),
        client_ip_address_present:
          Boolean(clientIpAddress),
        client_user_agent_present:
          Boolean(clientUserAgent),
      }),
    );

    const leadEventId = cleanTrackingValue(body.tracking?.lead_event_id, 160);
    const initiateCheckoutEventId = cleanTrackingValue(
      body.tracking?.initiate_checkout_event_id,
      160,
    );
    const eventSourceUrl = cleanTrackingValue(
      body.tracking?.event_source_url,
      1000,
    ) || env("MP_V2_EVENT_SOURCE_URL", "https://freelovablepro.com.br/").trim();

    if (!leadEventId || !initiateCheckoutEventId) {
      return json({ success: false, error: "IDs de tracking ausentes." }, 400);
    }

    const externalReference = createExternalReference();
    const notificationUrl = env(
      "MP_V2_NOTIFICATION_URL",
      "https://dxqkzcyzlsnzhqlfybwu.supabase.co/functions/v1/mercadopago-webhook-v2",
    ).trim();
    const successUrl = env("MP_V2_SUCCESS_URL").trim();
    const pendingUrl = env("MP_V2_PENDING_URL").trim();
    const failureUrl = env("MP_V2_FAILURE_URL").trim();
    const payerNameParts = name.split(/\s+/).filter(Boolean);
    const firstName = payerNameParts.shift() || name;
    const surname = payerNameParts.join(" ");
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const preferenceBody: Record<string, unknown> = {
      items: [{
        title: selectedPlan.title,
        quantity: 1,
        currency_id: "BRL",
        unit_price: selectedPlan.price,
      }],
      external_reference: externalReference,
      notification_url: notificationUrl,
      payer: { name: firstName, surname, email },
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: selectedPlan.maxInstallments,
        default_installments: 1,
      },
      metadata: {
        customer_name: name,
        customer_email: email,
        customer_whatsapp: whatsapp || "",
        plan,
        duration_days: selectedPlan.durationDays,
        external_reference: externalReference,
        fbp: normalizedFbp,
        fbc: normalizedFbc,
        tracking: {
          fbp: normalizedFbp,
          fbc: normalizedFbc,
          lead_event_id: leadEventId,
          initiate_checkout_event_id: initiateCheckoutEventId,
          ...utmTracking,
        },
      },
    };

    if (successUrl || pendingUrl || failureUrl) {
      preferenceBody.back_urls = {
        success: successUrl,
        pending: pendingUrl,
        failure: failureUrl,
      };
      preferenceBody.auto_return = "approved";
    }

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferenceBody),
      },
    );
    const responseText = await response.text();
    if (!response.ok) {
      return json({
        success: false,
        error: `Falha ao criar preferência: ${response.status}`,
        details: responseText,
      }, 500);
    }

    const preference = JSON.parse(responseText);
    const sessionPayload = {
      provider: "mercadopago",
      external_reference: externalReference,
      preference_id: String(preference.id || "").trim() || null,
      plan,
      duration_days: selectedPlan.durationDays,
      value: selectedPlan.price,
      customer_name: name,
      customer_email: email,
      customer_whatsapp: whatsapp || null,
      reseller_id: fallbackResellerId,
      status: "pending",
      fbp: normalizedFbp || null,
      fbc: normalizedFbc || null,
      client_ip_address: clientIpAddress || null,
      client_user_agent: clientUserAgent || null,
    };
    const { error: sessionError } = await supabaseAdmin
      .from("checkout_sessions_v2")
      .insert([sessionPayload]);
    if (sessionError) {
      return json({
        success: false,
        error: "Falha ao salvar sessão de checkout.",
        details: sessionError.message,
      }, 500);
    }

    const userData = await buildMetaUserData({
      name,
      email,
      whatsapp,
      fbp: normalizedFbp,
      fbc: normalizedFbc,
      externalId: externalReference,
      clientIpAddress,
      clientUserAgent,
    });
    const eventTime = Math.floor(Date.now() / 1000);
    const commonCustomData = {
      content_ids: [plan],
      content_type: "product",
      content_name: selectedPlan.title,
      currency: "BRL",
      value: selectedPlan.price,
      num_items: 1,
    };
    const metaResult = await sendMetaCheckoutEvents([
      {
        event_name: "Lead",
        event_time: eventTime,
        event_id: leadEventId,
        action_source: "website",
        event_source_url: eventSourceUrl,
        user_data: userData,
        custom_data: commonCustomData,
      },
      {
        event_name: "InitiateCheckout",
        event_time: eventTime,
        event_id: initiateCheckoutEventId,
        action_source: "website",
        event_source_url: eventSourceUrl,
        user_data: userData,
        custom_data: commonCustomData,
      },
    ]);

    if (!metaResult.sent) {
      console.error("mercadopago-create-preference-v2 meta error:", metaResult.reason);
    }

    return json({
      success: true,
      plan,
      external_reference: externalReference,
      preference_id: preference.id || "",
      init_point: preference.init_point || "",
      sandbox_init_point: preference.sandbox_init_point || "",
      meta_sent: metaResult.sent,
      meta_events_received: metaResult.eventsReceived,
      meta_error: metaResult.sent ? "" : metaResult.reason,
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});
