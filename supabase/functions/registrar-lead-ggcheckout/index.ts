import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import {
  normalizeClientUserAgent,
  normalizePhone,
  preserveClientUserAgent,
} from "../../../app/trackingIdentifiers.ts";

const FUNCTION_NAME = "registrar-lead-ggcheckout";
const LOG_PREFIX = "REGISTER_GGCHECKOUT_LEAD_RESULT";
const PROVIDER = "ggcheckout";
const IDEMPOTENCY_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 64 * 1024;
const DEFAULT_ALLOWED_ORIGINS = ["https://freelovablepro.com.br"] as const;

const ALLOWED_PLANS = {
  mensal: { canonicalPlan: "plan_30d", durationDays: 30, value: 47 },
  trimestral: { canonicalPlan: "plan_90d", durationDays: 90, value: 111 },
  anual: { canonicalPlan: "plan_3650d", durationDays: 365, value: 324 },
} as const;

type PlanAlias = keyof typeof ALLOWED_PLANS;
type CanonicalPlan = typeof ALLOWED_PLANS[PlanAlias]["canonicalPlan"];

const CANONICAL_TO_ALIAS: Readonly<Record<CanonicalPlan, PlanAlias>> = {
  plan_30d: "mensal",
  plan_90d: "trimestral",
  plan_3650d: "anual",
};

type RequestBody = {
  plan?: unknown;
  customer_name?: unknown;
  customer_email?: unknown;
  customer_whatsapp?: unknown;
  name?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  client_user_agent?: unknown;
  fbp?: unknown;
  fbc?: unknown;
  reseller_id?: unknown;
  meta_campaign_id?: unknown;
  meta_adset_id?: unknown;
  meta_ad_id?: unknown;
  campaign_id?: unknown;
  adset_id?: unknown;
  ad_id?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_content?: unknown;
  utm_term?: unknown;
  fbclid?: unknown;
  src?: unknown;
  sck?: unknown;
  xcod?: unknown;
  landing_page_url?: unknown;
  referrer_url?: unknown;
  tracking?: {
    fbp?: unknown;
    fbc?: unknown;
    meta_campaign_id?: unknown;
    meta_adset_id?: unknown;
    meta_ad_id?: unknown;
    campaign_id?: unknown;
    adset_id?: unknown;
    ad_id?: unknown;
    utm_source?: unknown;
    utm_medium?: unknown;
    utm_campaign?: unknown;
    utm_content?: unknown;
    utm_term?: unknown;
    fbclid?: unknown;
    src?: unknown;
    sck?: unknown;
    xcod?: unknown;
    landing_page_url?: unknown;
    referrer_url?: unknown;
  } | null;
};

type ExistingSession = {
  id: string;
  external_reference: string;
  client_user_agent: string | null;
};

function env(name: string) {
  return String(Deno.env.get(name) || "").trim();
}

function allowedOrigins() {
  const configured = env("GGCHECKOUT_ALLOWED_ORIGINS")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set(configured.length ? configured : DEFAULT_ALLOWED_ORIGINS);
}

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins().has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(payload: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function optionalString(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.length > maxLength) return undefined;
  return value.trim() || null;
}

function normalizeName(value: unknown) {
  if (typeof value !== "string" || value.length > 160) return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length >= 2 && normalized.length <= 120 ? normalized : null;
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string" || value.length > 254) return null;
  const normalized = value.trim().toLowerCase();
  if (
    !normalized ||
    normalized.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)
  ) return null;
  return normalized;
}

function normalizePlan(value: unknown): PlanAlias | null {
  if (typeof value !== "string" || value.length > 40) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized in ALLOWED_PLANS) return normalized as PlanAlias;
  return CANONICAL_TO_ALIAS[normalized as CanonicalPlan] || null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}

function clientIp(request: Request) {
  const candidate = request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() || "";
  return candidate ? candidate.slice(0, 64) : null;
}

function userAgent(request: Request) {
  return normalizeClientUserAgent(request.headers.get("user-agent"));
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function fingerprint(
  email: string,
  whatsapp: string,
  canonicalPlan: string,
  bucket: number,
) {
  return await sha256(
    `${PROVIDER}\n${email}\n${whatsapp}\n${canonicalPlan}\n${bucket}`,
  );
}

function success(
  row: ExistingSession,
  duplicate: boolean,
  origin: string | null,
) {
  return json({
    success: true,
    session_id: row.id,
    external_reference: row.external_reference,
    provider: PROVIDER,
    status: "lead_created",
    duplicate,
  }, duplicate ? 200 : 201, origin);
}

function logResult(fields: Record<string, unknown>) {
  console.log(LOG_PREFIX, JSON.stringify({
    function: FUNCTION_NAME,
    provider: PROVIDER,
    ...fields,
  }));
}

serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins().has(origin)) {
    logResult({ status: "error", error_code: "origin_not_allowed" });
    return json({ success: false, error: "origin_not_allowed" }, 403, origin);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") {
    return json({ success: false, error: "method_not_allowed" }, 405, origin);
  }
  if (
    !request.headers.get("content-type")?.toLowerCase().startsWith(
      "application/json",
    )
  ) {
    return json(
      { success: false, error: "unsupported_media_type" },
      415,
      origin,
    );
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json({ success: false, error: "payload_too_large" }, 413, origin);
  }

  let body: RequestBody;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return json({ success: false, error: "payload_too_large" }, 413, origin);
    }
    body = JSON.parse(rawBody) as RequestBody;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch {
    logResult({ status: "error", error_code: "invalid_request_body" });
    return json({
      success: false,
      error: "invalid_request",
      message: "Dados do formulário inválidos.",
    }, 400, origin);
  }

  const planAlias = normalizePlan(body.plan);
  const name = normalizeName(body.customer_name ?? body.name);
  const email = normalizeEmail(body.customer_email ?? body.email);
  const whatsapp = normalizePhone(body.customer_whatsapp ?? body.whatsapp);
  const browserUserAgent = normalizeClientUserAgent(body.client_user_agent);
  const fbp = optionalString(body.fbp ?? body.tracking?.fbp, 255);
  const fbc = optionalString(body.fbc ?? body.tracking?.fbc, 500);
  const resellerId = optionalString(body.reseller_id, 36);
  const metaCampaignId = optionalString(
    body.meta_campaign_id ??
      body.campaign_id ??
      body.tracking?.meta_campaign_id ??
      body.tracking?.campaign_id,
    100,
  );
  const metaAdsetId = optionalString(
    body.meta_adset_id ??
      body.adset_id ??
      body.tracking?.meta_adset_id ??
      body.tracking?.adset_id,
    100,
  );
  const metaAdId = optionalString(
    body.meta_ad_id ??
      body.ad_id ??
      body.tracking?.meta_ad_id ??
      body.tracking?.ad_id,
    100,
  );
  const utmSource = optionalString(
    body.utm_source ?? body.tracking?.utm_source,
    500,
  );
  const utmMedium = optionalString(
    body.utm_medium ?? body.tracking?.utm_medium,
    500,
  );
  const utmCampaign = optionalString(
    body.utm_campaign ?? body.tracking?.utm_campaign,
    1000,
  );
  const utmContent = optionalString(
    body.utm_content ?? body.tracking?.utm_content,
    1000,
  );
  const utmTerm = optionalString(
    body.utm_term ?? body.tracking?.utm_term,
    1000,
  );
  const fbclid = optionalString(body.fbclid ?? body.tracking?.fbclid, 500);
  const src = optionalString(body.src ?? body.tracking?.src, 500);
  const sck = optionalString(body.sck ?? body.tracking?.sck, 500);
  const xcod = optionalString(body.xcod ?? body.tracking?.xcod, 500);
  const landingPageUrl = optionalString(
    body.landing_page_url ?? body.tracking?.landing_page_url,
    2000,
  );
  const referrerUrl = optionalString(
    body.referrer_url ?? body.tracking?.referrer_url,
    2000,
  );

  if (
    !planAlias || !name || !email || !whatsapp ||
    fbp === undefined || fbc === undefined || resellerId === undefined ||
    metaCampaignId === undefined || metaAdsetId === undefined ||
    metaAdId === undefined ||
    utmSource === undefined || utmCampaign === undefined ||
    utmMedium === undefined || utmContent === undefined ||
    utmTerm === undefined || fbclid === undefined ||
    src === undefined || sck === undefined || xcod === undefined ||
    landingPageUrl === undefined || referrerUrl === undefined ||
    (resellerId !== null && !isUuid(resellerId))
  ) {
    logResult({ status: "error", error_code: "invalid_request_fields" });
    return json({
      success: false,
      error: "invalid_request",
      message: "Dados do formulário inválidos.",
    }, 400, origin);
  }

  const supabaseUrl = env("SUPABASE_URL");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    logResult({ status: "error", error_code: "missing_environment" });
    return json({
      success: false,
      error: "database_error",
      message: "Não foi possível registrar o lead.",
    }, 500, origin);
  }

  const selectedPlan = ALLOWED_PLANS[planAlias];
  const canonicalPlan = selectedPlan.canonicalPlan;
  const requestIp = clientIp(request);
  const requestUserAgent = userAgent(request);
  const now = new Date();
  const currentBucket = Math.floor(now.getTime() / IDEMPOTENCY_WINDOW_MS);
  const currentFingerprint = await fingerprint(
    email,
    whatsapp,
    canonicalPlan,
    currentBucket,
  );
  const previousFingerprint = await fingerprint(
    email,
    whatsapp,
    canonicalPlan,
    currentBucket - 1,
  );
  const recentThreshold = new Date(
    now.getTime() - IDEMPOTENCY_WINDOW_MS,
  ).toISOString();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const findRecentDuplicate = () => supabase
    .from("checkout_sessions_v2")
    .select("id,external_reference,client_user_agent")
    .eq("provider", PROVIDER)
    .in("idempotency_fingerprint", [
      currentFingerprint,
      previousFingerprint,
    ])
    .gte("last_attempt_at", recentThreshold)
    .order("last_attempt_at", { ascending: false })
    .limit(1)
    .maybeSingle<ExistingSession>();

  const { data: existing, error: lookupError } = await findRecentDuplicate();
  if (lookupError) {
    logResult({
      status: "error",
      plan: canonicalPlan,
      error_code: "idempotency_lookup_failed",
    });
    return json({
      success: false,
      error: "database_error",
      message: "Não foi possível registrar o lead.",
    }, 500, origin);
  }
  if (existing) {
    const preservedUserAgent = preserveClientUserAgent(
      existing.client_user_agent,
      requestUserAgent,
      browserUserAgent,
    );
    if (!existing.client_user_agent && preservedUserAgent) {
      await supabase
        .from("checkout_sessions_v2")
        .update({ client_user_agent: preservedUserAgent })
        .eq("id", existing.id)
        .is("client_user_agent", null);
    }
    logResult({
      status: "lead_created",
      session_id: existing.id,
      external_reference: existing.external_reference,
      plan: canonicalPlan,
      duplicate: true,
      tracking: {
        campaign: Boolean(metaCampaignId),
        adset: Boolean(metaAdsetId),
        ad: Boolean(metaAdId),
      },
      technical: {
        ip_present: Boolean(requestIp),
        user_agent_present: Boolean(preservedUserAgent),
      },
    });
    return success(existing, true, origin);
  }

  const sessionId = crypto.randomUUID();
  const externalReference = `ggcheckout_${sessionId}`;
  const attemptId = crypto.randomUUID();
  const insertPayload = {
    id: sessionId,
    provider: PROVIDER,
    external_reference: externalReference,
    plan: canonicalPlan,
    duration_days: selectedPlan.durationDays,
    value: selectedPlan.value,
    customer_name: name,
    customer_email: email,
    customer_whatsapp: whatsapp,
    reseller_id: resellerId,
    status: "lead_created",
    status_detail: "formulario_salvo",
    attempt_id: attemptId,
    idempotency_fingerprint: currentFingerprint,
    last_attempt_at: now.toISOString(),
    fbp,
    fbc,
    meta_campaign_id: metaCampaignId,
    meta_adset_id: metaAdsetId,
    meta_ad_id: metaAdId,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
    fbclid,
    src,
    sck,
    xcod,
    landing_page_url: landingPageUrl,
    referrer_url: referrerUrl,
    client_ip_address: requestIp,
    client_user_agent: preserveClientUserAgent(
      null,
      requestUserAgent,
      browserUserAgent,
    ),
  };
  const { data: inserted, error: insertError } = await supabase
    .from("checkout_sessions_v2")
    .insert(insertPayload)
    .select("id,external_reference,client_user_agent")
    .single<ExistingSession>();

  if (insertError || !inserted) {
    if (insertError?.code === "23505") {
      const { data: concurrentDuplicate } = await findRecentDuplicate();
      if (concurrentDuplicate) {
        logResult({
          status: "lead_created",
          session_id: concurrentDuplicate.id,
          external_reference: concurrentDuplicate.external_reference,
          plan: canonicalPlan,
          duplicate: true,
          tracking: {
            campaign: Boolean(metaCampaignId),
            adset: Boolean(metaAdsetId),
            ad: Boolean(metaAdId),
          },
          technical: {
            ip_present: Boolean(requestIp),
            user_agent_present: Boolean(
              concurrentDuplicate.client_user_agent || requestUserAgent ||
                browserUserAgent,
            ),
          },
        });
        return success(concurrentDuplicate, true, origin);
      }
    }
    logResult({
      status: "error",
      session_id: sessionId,
      external_reference: externalReference,
      plan: canonicalPlan,
      duplicate: false,
      error_code: "insert_failed",
    });
    return json({
      success: false,
      error: "database_error",
      message: "Não foi possível registrar o lead.",
    }, 500, origin);
  }

  logResult({
    status: "lead_created",
    session_id: inserted.id,
    external_reference: inserted.external_reference,
    plan: canonicalPlan,
    duplicate: false,
    tracking: {
      campaign: Boolean(metaCampaignId),
      adset: Boolean(metaAdsetId),
      ad: Boolean(metaAdId),
    },
    technical: {
      ip_present: Boolean(requestIp),
      user_agent_present: Boolean(inserted.client_user_agent),
    },
  });
  return success(inserted, false, origin);
});
