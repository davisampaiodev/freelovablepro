export type NormalizedBrazilPhone =
  | { valid: true; e164: string; digits: string; masked: string }
  | { valid: false; digits: string; masked: string; reason: string };

export function maskPhone(value: string | null | undefined) {
  const digits = (value || "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.length <= 4) return "*".repeat(digits.length);
  return `${digits.slice(0, 4)}***${digits.slice(-2)}`;
}

export function normalizeBrazilPhone(value: string | null | undefined): NormalizedBrazilPhone {
  const digits = (value || "").replace(/\D+/g, "");

  if (!digits) {
    return { valid: false, digits, masked: "", reason: "empty" };
  }

  let normalized = digits;
  if (digits.length === 11) {
    normalized = `55${digits}`;
  } else if (digits.startsWith("55")) {
    normalized = digits;
  } else {
    return {
      valid: false,
      digits,
      masked: maskPhone(digits),
      reason: "invalid_brazil_phone",
    };
  }

  if (normalized.length < 12 || normalized.length > 13) {
    return {
      valid: false,
      digits,
      masked: maskPhone(normalized),
      reason: "invalid_length",
    };
  }

  return {
    valid: true,
    e164: `+${normalized}`,
    digits: normalized,
    masked: maskPhone(normalized),
  };
}
