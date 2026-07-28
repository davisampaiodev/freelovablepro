const META_FBC_STORAGE_KEY = "meta_fbc";
const META_FBP_STORAGE_KEY = "meta_fbp";
const TRACKING_MAX_AGE_SECONDS = 7776000;

export type MetaFbcSource =
  | "current_fbclid"
  | "cookie"
  | "local_storage"
  | "session_storage"
  | "none";

export type MetaTracking = {
  fbp: string | null;
  fbc: string | null;
  fbcSource: MetaFbcSource;
  fbclidPresent: boolean;
};

export function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.substring(name.length + 1));
  } catch {
    return null;
  }
}

export function isValidFbc(value: unknown) {
  const normalized = String(value || "").trim();
  return /^fb\.\d+\.\d+\..+$/.test(normalized);
}

function isValidFbp(value: unknown) {
  const normalized = String(value || "").trim();
  return /^fb\.\d+\.\d+\..+$/.test(normalized);
}

function readCurrentFbclid() {
  if (typeof window === "undefined") return "";
  const searchParams = new URLSearchParams(window.location.search);
  return String(searchParams.get("fbclid") || "").trim();
}

function readStorage(storage: Storage, key: string) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string) {
  if (!value) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Storage restrictions must not interrupt checkout.
  }
}

function writeTrackingCookie(name: string, value: string) {
  if (typeof document === "undefined" || !value) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${name}=${encodeURIComponent(value)}; path=/; ` +
    `max-age=${TRACKING_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function persistFbc(value: string) {
  if (!isValidFbc(value)) return;
  writeTrackingCookie("_fbc", value);
  writeStorage(window.localStorage, META_FBC_STORAGE_KEY, value);
  writeStorage(window.sessionStorage, META_FBC_STORAGE_KEY, value);
}

function persistFbp(value: string) {
  if (!isValidFbp(value)) return;
  writeStorage(window.localStorage, META_FBP_STORAGE_KEY, value);
  writeStorage(window.sessionStorage, META_FBP_STORAGE_KEY, value);
}

function fbcMatchesClick(fbc: string, fbclid: string) {
  return isValidFbc(fbc) && fbc.endsWith(`.${fbclid}`);
}

function getOrCreateFbcFromCurrentFbclid(fbclid: string) {
  const candidates = [
    readCookie("_fbc"),
    readStorage(window.localStorage, META_FBC_STORAGE_KEY),
    readStorage(window.sessionStorage, META_FBC_STORAGE_KEY),
  ];
  const existing = candidates.find(
    (candidate): candidate is string =>
      Boolean(candidate && fbcMatchesClick(candidate, fbclid)),
  );
  if (existing) {
    persistFbc(existing);
    return existing;
  }
  const generatedFbc = `fb.1.${Date.now()}.${fbclid}`;
  persistFbc(generatedFbc);
  return generatedFbc;
}

function resolveMetaFbc() {
  const currentFbclid = readCurrentFbclid();
  if (currentFbclid) {
    return {
      value: getOrCreateFbcFromCurrentFbclid(currentFbclid),
      source: "current_fbclid" as const,
    };
  }
  const candidates: Array<{
    value: string | null;
    source: MetaFbcSource;
  }> = [
    { value: readCookie("_fbc"), source: "cookie" },
    {
      value: readStorage(window.localStorage, META_FBC_STORAGE_KEY),
      source: "local_storage",
    },
    {
      value: readStorage(window.sessionStorage, META_FBC_STORAGE_KEY),
      source: "session_storage",
    },
  ];
  const resolved = candidates.find(({ value }) => isValidFbc(value));
  if (!resolved?.value) return { value: null, source: "none" as const };
  persistFbc(resolved.value);
  return { value: resolved.value, source: resolved.source };
}

function resolveMetaFbp() {
  const candidates = [
    readCookie("_fbp"),
    readStorage(window.localStorage, META_FBP_STORAGE_KEY),
    readStorage(window.sessionStorage, META_FBP_STORAGE_KEY),
  ];
  const resolved = candidates.find(
    (candidate): candidate is string => isValidFbp(candidate),
  );
  if (!resolved) return null;
  persistFbp(resolved);
  return resolved;
}

export function resolveMetaTracking(): MetaTracking {
  if (typeof window === "undefined") {
    return {
      fbp: null,
      fbc: null,
      fbcSource: "none",
      fbclidPresent: false,
    };
  }
  const fbclidPresent = Boolean(readCurrentFbclid());
  const resolvedFbc = resolveMetaFbc();
  const fbp = resolveMetaFbp();
  console.log("meta tracking resolved:", {
    fbclid_present: fbclidPresent,
    fbp_present: Boolean(fbp),
    fbc_present: Boolean(resolvedFbc.value),
    fbc_source: resolvedFbc.source,
  });
  return {
    fbp,
    fbc: resolvedFbc.value,
    fbcSource: resolvedFbc.source,
    fbclidPresent,
  };
}
