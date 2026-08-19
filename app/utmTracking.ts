const UTM_STORAGE_PREFIX = "utmify_";
const ATTRIBUTION_SNAPSHOT_STORAGE_KEY = `${UTM_STORAGE_PREFIX}attribution_snapshot_v1`;
const ATTRIBUTION_SNAPSHOT_VERSION = 1;
const ATTRIBUTION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

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

type AttributionValues = Pick<UtmTracking, (typeof TRACKING_KEYS)[number]>;

type AttributionSnapshot = {
  version: typeof ATTRIBUTION_SNAPSHOT_VERSION;
  captured_at: number;
  values: AttributionValues;
};

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

function removeStorage(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Storage restrictions must not interrupt checkout.
  }
}

function emptyAttributionValues(): AttributionValues {
  return Object.fromEntries(
    TRACKING_KEYS.map((key) => [key, null]),
  ) as AttributionValues;
}

function readAttributionSnapshot(
  storage: Storage,
  enforceExpiration: boolean,
): AttributionSnapshot | null {
  const raw = readStorage(storage, ATTRIBUTION_SNAPSHOT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AttributionSnapshot>;
    if (
      parsed.version !== ATTRIBUTION_SNAPSHOT_VERSION ||
      typeof parsed.captured_at !== "number" ||
      !Number.isFinite(parsed.captured_at) ||
      !parsed.values ||
      typeof parsed.values !== "object"
    ) return null;
    if (
      enforceExpiration &&
      Date.now() - parsed.captured_at > ATTRIBUTION_MAX_AGE_MS
    ) {
      removeStorage(storage, ATTRIBUTION_SNAPSHOT_STORAGE_KEY);
      for (const key of TRACKING_KEYS) {
        removeStorage(storage, `${UTM_STORAGE_PREFIX}${key}`);
      }
      return null;
    }

    const values = emptyAttributionValues();
    for (const key of TRACKING_KEYS) {
      const value = parsed.values[key];
      values[key] = typeof value === "string" && value.trim()
        ? value.trim().slice(0, VALUE_LIMITS[key] || 1000)
        : null;
    }
    return {
      version: ATTRIBUTION_SNAPSHOT_VERSION,
      captured_at: parsed.captured_at,
      values,
    };
  } catch {
    return null;
  }
}

function writeAttributionSnapshot(snapshot: AttributionSnapshot) {
  const serialized = JSON.stringify(snapshot);
  writeStorage(
    window.sessionStorage,
    ATTRIBUTION_SNAPSHOT_STORAGE_KEY,
    serialized,
  );
  writeStorage(
    window.localStorage,
    ATTRIBUTION_SNAPSHOT_STORAGE_KEY,
    serialized,
  );

  // Keep the existing per-key values for compatibility with scripts that
  // already consume the utmify_* keys. Resolution uses only the coherent
  // snapshot, so missing fields from a new click cannot inherit old values.
  for (const key of TRACKING_KEYS) {
    const value = snapshot.values[key];
    const storageKey = `${UTM_STORAGE_PREFIX}${key}`;
    if (value) {
      writeStorage(window.sessionStorage, storageKey, value);
      writeStorage(window.localStorage, storageKey, value);
    } else {
      removeStorage(window.sessionStorage, storageKey);
      removeStorage(window.localStorage, storageKey);
    }
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
  const currentValues = emptyAttributionValues();
  let hasCurrentAttribution = false;
  for (const key of TRACKING_KEYS) {
    currentValues[key] = readQueryValue(params, key);
    if (currentValues[key]) hasCurrentAttribution = true;
  }

  let snapshot: AttributionSnapshot | null;
  if (hasCurrentAttribution) {
    snapshot = {
      version: ATTRIBUTION_SNAPSHOT_VERSION,
      captured_at: Date.now(),
      values: currentValues,
    };
    writeAttributionSnapshot(snapshot);
  } else {
    snapshot = readAttributionSnapshot(window.sessionStorage, false) ||
      readAttributionSnapshot(window.localStorage, true);
    if (snapshot) {
      writeStorage(
        window.sessionStorage,
        ATTRIBUTION_SNAPSHOT_STORAGE_KEY,
        JSON.stringify(snapshot),
      );
    }
  }

  if (snapshot) {
    for (const key of TRACKING_KEYS) resolved[key] = snapshot.values[key];
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
