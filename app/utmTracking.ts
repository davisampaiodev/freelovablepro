const UTM_STORAGE_PREFIX = "utmify_";

export type UtmTracking = {
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

const TRACKING_KEYS = [
  "src",
  "sck",
  "utm_source",
  "utm_campaign",
  "utm_medium",
  "utm_content",
  "utm_term",
] as const;

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

export function resolveUtmTracking(): UtmTracking {
  const empty = Object.fromEntries(
    TRACKING_KEYS.map((key) => [key, null]),
  ) as UtmTracking;

  if (typeof window === "undefined") return empty;

  const params = new URLSearchParams(window.location.search);
  const resolved = { ...empty };

  for (const key of TRACKING_KEYS) {
    const storageKey = `${UTM_STORAGE_PREFIX}${key}`;
    const currentValue = String(params.get(key) || "").trim();

    if (currentValue) {
      writeStorage(window.localStorage, storageKey, currentValue);
      writeStorage(window.sessionStorage, storageKey, currentValue);
      resolved[key] = currentValue;
      continue;
    }

    resolved[key] =
      readStorage(window.localStorage, storageKey) ||
      readStorage(window.sessionStorage, storageKey);
  }

  console.log("utm tracking resolved:", {
    src_present: Boolean(resolved.src),
    sck_present: Boolean(resolved.sck),
    utm_source_present: Boolean(resolved.utm_source),
    utm_campaign_present: Boolean(resolved.utm_campaign),
    utm_medium_present: Boolean(resolved.utm_medium),
    utm_content_present: Boolean(resolved.utm_content),
    utm_term_present: Boolean(resolved.utm_term),
  });

  return resolved;
}
