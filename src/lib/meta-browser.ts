const META_EXTERNAL_ID_STORAGE_KEY = "meta_external_id";

function createExternalId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `meta_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getMetaExternalId() {
  if (typeof window === "undefined") return "";

  try {
    const stored = window.localStorage.getItem(META_EXTERNAL_ID_STORAGE_KEY);
    if (stored) return stored;

    const externalId = createExternalId();
    window.localStorage.setItem(META_EXTERNAL_ID_STORAGE_KEY, externalId);
    return externalId;
  } catch {
    // Tracking must not block the purchase flow when storage is unavailable.
    return createExternalId();
  }
}

export function getMetaCookie(name: "_fbp" | "_fbc") {
  if (typeof document === "undefined") return "";

  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? "";
}
