const UTM_STORAGE_PREFIX = "utmify_";

export type UtmTracking = {
  src: string | null;
  sck: string | null;
  fbclid: string | null;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  meta_ad_id: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_page_url: string | null;
  referrer_url: string | null;
};

const TRACKING_KEYS = [
  "src",
  "sck",
  "fbclid",
  "meta_campaign_id",
  "meta_adset_id",
  "meta_ad_id",
  "utm_source",
  "utm_campaign",
  "utm_medium",
  "utm_content",
  "utm_term",
] as const;

const QUERY_ALIASES: Partial<Record<(typeof TRACKING_KEYS)[number], string[]>> = {
  meta_campaign_id: ["meta_campaign_id", "campaign_id"],
  meta_adset_id: ["meta_adset_id", "adset_id"],
  meta_ad_id: ["meta_ad_id", "ad_id"],
};

const VALUE_LIMITS: Partial<Record<(typeof TRACKING_KEYS)[number], number>> = {
  src: 500,
  sck: 500,
  fbclid: 500,
  meta_campaign_id: 100,
  meta_adset_id: 100,
  meta_ad_id: 100,
  utm_source: 500,
  utm_medium: 500,
  utm_campaign: 1000,
  utm_content: 1000,
  utm_term: 1000,
};

const LANDING_PAGE_STORAGE_KEY = `${UTM_STORAGE_PREFIX}landing_page_url`;
const REFERRER_STORAGE_KEY = `${UTM_STORAGE_PREFIX}referrer_url`;

function readStorage(storage: Storage, key: string) {
  try {
    return String(storage.getItem(key) || "").trim() || null;
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string) {
  if (!value) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Tracking must not interrupt checkout.
  }
}

function readQueryValue(
  params: URLSearchParams,
  key: (typeof TRACKING_KEYS)[number],
) {
  const aliases = QUERY_ALIASES[key] || [key];
  for (const alias of aliases) {
    const value = String(params.get(alias) || "").trim();
    if (value) return value.slice(0, VALUE_LIMITS[key] || 1000);
  }
  return null;
}

function resolveFirstTouchValue(
  storageKey: string,
  currentValue: string,
  maxLength: number,
) {
  const stored = readStorage(window.sessionStorage, storageKey);
  if (stored) return stored.slice(0, maxLength);

  const normalized = currentValue.trim().slice(0, maxLength);
  if (!normalized) return null;
  writeStorage(window.sessionStorage, storageKey, normalized);
  writeStorage(window.localStorage, storageKey, normalized);
  return normalized;
}

export function resolveUtmTracking(): UtmTracking {
  const empty = {
    ...Object.fromEntries(
      TRACKING_KEYS.map((key) => [key, null]),
    ),
    landing_page_url: null,
    referrer_url: null,
  } as UtmTracking;

  if (typeof window === "undefined") return empty;

  const params = new URLSearchParams(window.location.search);
  const resolved = { ...empty };

  for (const key of TRACKING_KEYS) {
    const storageKey = `${UTM_STORAGE_PREFIX}${key}`;
    const currentValue = readQueryValue(params, key);

    if (currentValue) {
      writeStorage(window.localStorage, storageKey, currentValue);
      writeStorage(window.sessionStorage, storageKey, currentValue);
      resolved[key] = currentValue;
      continue;
    }

    resolved[key] =
      (
        readStorage(window.sessionStorage, storageKey) ||
        readStorage(window.localStorage, storageKey)
      )?.slice(0, VALUE_LIMITS[key] || 1000) || null;
  }

  resolved.landing_page_url = resolveFirstTouchValue(
    LANDING_PAGE_STORAGE_KEY,
    window.location.href,
    2000,
  );
  resolved.referrer_url = resolveFirstTouchValue(
    REFERRER_STORAGE_KEY,
    document.referrer,
    2000,
  );

  console.log("utm tracking resolved:", {
    src_present: Boolean(resolved.src),
    sck_present: Boolean(resolved.sck),
    fbclid_present: Boolean(resolved.fbclid),
    utm_source_present: Boolean(resolved.utm_source),
    utm_campaign_present: Boolean(resolved.utm_campaign),
    utm_medium_present: Boolean(resolved.utm_medium),
    utm_content_present: Boolean(resolved.utm_content),
    utm_term_present: Boolean(resolved.utm_term),
    meta_campaign_id_present: Boolean(resolved.meta_campaign_id),
    meta_adset_id_present: Boolean(resolved.meta_adset_id),
    meta_ad_id_present: Boolean(resolved.meta_ad_id),
    landing_page_url_present: Boolean(resolved.landing_page_url),
    referrer_url_present: Boolean(resolved.referrer_url),
  });

  return resolved;
}
