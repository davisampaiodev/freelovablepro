const BRAZIL_COUNTRY_CODE = "55";
const MAX_PHONE_DIGITS = 15;
const MAX_USER_AGENT_LENGTH = 512;

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const explicitlyInternational = raw.startsWith("+") || raw.startsWith("00");
  let digits = raw.replace(/\D+/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!digits || digits.length > MAX_PHONE_DIGITS || /^(\d)\1+$/.test(digits)) {
    return null;
  }

  if (explicitlyInternational && !digits.startsWith(BRAZIL_COUNTRY_CODE)) {
    return digits.length >= 8 ? digits : null;
  }

  // Brazilian numbers entered without a country code have 10 or 11 digits.
  if (digits.length === 10 || digits.length === 11) {
    const areaCode = digits.slice(0, 2);
    const subscriber = digits.slice(2);
    if (!/^[1-9]\d$/.test(areaCode) || !/^[2-9]\d{7,8}$/.test(subscriber)) {
      return null;
    }
    return `${BRAZIL_COUNTRY_CODE}${digits}`;
  }

  // A Brazilian number that already includes 55 must not receive it twice.
  if (digits.startsWith(BRAZIL_COUNTRY_CODE)) {
    const nationalNumber = digits.slice(BRAZIL_COUNTRY_CODE.length);
    if (nationalNumber.length !== 10 && nationalNumber.length !== 11) return null;
    const areaCode = nationalNumber.slice(0, 2);
    const subscriber = nationalNumber.slice(2);
    return /^[1-9]\d$/.test(areaCode) && /^[2-9]\d{7,8}$/.test(subscriber)
      ? digits
      : null;
  }

  // Preserve plausible international E.164 numbers instead of assuming Brazil.
  return digits.length >= 8 ? digits : null;
}

export function normalizeClientUserAgent(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, MAX_USER_AGENT_LENGTH) : null;
}

export function preserveClientUserAgent(
  existingValue: unknown,
  requestHeaderValue: unknown,
  browserValue: unknown,
): string | null {
  return normalizeClientUserAgent(existingValue) ||
    normalizeClientUserAgent(requestHeaderValue) ||
    normalizeClientUserAgent(browserValue);
}

export function normalizeFbclid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > 500) return null;
  return /^[A-Za-z0-9_-]+$/.test(normalized) ? normalized : null;
}

export function createFbcFromFbclid(
  value: unknown,
  timestamp = Date.now(),
): string | null {
  const fbclid = normalizeFbclid(value);
  if (!fbclid || !Number.isFinite(timestamp) || timestamp <= 0) return null;
  return `fb.1.${Math.trunc(timestamp)}.${fbclid}`;
}

export function isValidFbc(value: unknown): value is string {
  return typeof value === "string" && /^fb\.\d+\.\d+\..+$/.test(value.trim());
}

export function resolveFbcForClick(
  existingValues: Array<string | null>,
  currentFbclid: unknown,
  timestamp = Date.now(),
): string | null {
  const fbclid = normalizeFbclid(currentFbclid);
  if (!fbclid) return existingValues.find(isValidFbc)?.trim() || null;
  return existingValues.find(
    (candidate) => isValidFbc(candidate) && candidate.endsWith(`.${fbclid}`),
  )?.trim() || createFbcFromFbclid(fbclid, timestamp);
}
