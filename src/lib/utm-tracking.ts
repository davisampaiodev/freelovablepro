const ATTRIBUTION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const STORAGE_TIMESTAMP_KEY = "freelovable_attribution_updated_at";

const URL_ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "fbclid",
  "campaign_id",
  "adset_id",
  "ad_id",
  "src",
  "xcod",
  "sck",
] as const;

type AttributionKey = (typeof URL_ATTRIBUTION_KEYS)[number];

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
}

function readStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function storeValue(key: string, value: string) {
  if (!value) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Tracking must never block the landing page or checkout.
  }
}

function clearExpiredAttribution() {
  const updatedAt = Number(readStoredValue(STORAGE_TIMESTAMP_KEY));
  if (!updatedAt || Date.now() - updatedAt <= ATTRIBUTION_TTL_MS) return;

  try {
    for (const key of URL_ATTRIBUTION_KEYS) {
      window.localStorage.removeItem(key);
    }
    window.localStorage.removeItem("fbp");
    window.localStorage.removeItem("fbc");
    window.localStorage.removeItem("landing_page");
    window.localStorage.removeItem("landing_referrer");
    window.localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
  } catch {
    // Tracking must never block the landing page or checkout.
  }
}

export function captureAttribution() {
  if (typeof window === "undefined") return;

  clearExpiredAttribution();

  const searchParams = new URLSearchParams(window.location.search);
  let capturedNewAttribution = false;

  for (const key of URL_ATTRIBUTION_KEYS) {
    const value = searchParams.get(key)?.trim();
    if (!value) continue;

    storeValue(key, value);
    capturedNewAttribution = true;
  }

  const fbclid = searchParams.get("fbclid")?.trim() || readStoredValue("fbclid");
  const fbp = readCookie("_fbp") || readStoredValue("fbp");
  const fbc =
    readCookie("_fbc") ||
    readStoredValue("fbc") ||
    (fbclid ? `fb.1.${Date.now()}.${fbclid}` : "");

  storeValue("fbp", fbp);
  storeValue("fbc", fbc);

  if (!readStoredValue("landing_page")) {
    storeValue("landing_page", window.location.href);
  }

  if (!readStoredValue("landing_referrer") && document.referrer) {
    storeValue("landing_referrer", document.referrer);
  }

  if (capturedNewAttribution || !readStoredValue(STORAGE_TIMESTAMP_KEY)) {
    storeValue(STORAGE_TIMESTAMP_KEY, String(Date.now()));
  }
}

export function getStoredAttribution() {
  if (typeof window === "undefined") {
    return {} as Partial<Record<AttributionKey, string>> & {
      fbp?: string;
      fbc?: string;
      landing_page?: string;
      landing_referrer?: string;
      page_origin?: string;
    };
  }

  captureAttribution();

  const attribution: Partial<Record<AttributionKey, string>> & {
    fbp?: string;
    fbc?: string;
    landing_page?: string;
    landing_referrer?: string;
    page_origin?: string;
  } = {};

  for (const key of URL_ATTRIBUTION_KEYS) {
    const value =
      new URLSearchParams(window.location.search).get(key)?.trim() ||
      readStoredValue(key);

    if (value) attribution[key] = value;
  }

  const fbp = readCookie("_fbp") || readStoredValue("fbp");
  const fbc = readCookie("_fbc") || readStoredValue("fbc");
  const landingPage = readStoredValue("landing_page");
  const landingReferrer = readStoredValue("landing_referrer");

  if (fbp) attribution.fbp = fbp;
  if (fbc) attribution.fbc = fbc;
  if (landingPage) attribution.landing_page = landingPage;
  if (landingReferrer) attribution.landing_referrer = landingReferrer;

  attribution.page_origin = `${window.location.origin}${window.location.pathname}`;

  return attribution;
}

export function buildTrackedCheckoutUrl(checkoutUrl: string) {
  if (typeof window === "undefined") return checkoutUrl;

  const url = new URL(checkoutUrl);
  const attribution = getStoredAttribution();

  for (const [key, value] of Object.entries(attribution)) {
    if (value) url.searchParams.set(key, value);
  }

  return url.toString();
}
