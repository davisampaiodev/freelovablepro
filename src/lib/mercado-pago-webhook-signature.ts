import { createHmac, timingSafeEqual } from "node:crypto";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : null;
}

function numericPaymentId(value: unknown) {
  const candidate = typeof value === "number" ? String(value) : value;
  return typeof candidate === "string" && /^\d{1,30}$/.test(candidate.trim())
    ? candidate.trim()
    : null;
}

export function extractPaymentId(request: Request, body: unknown): string | null {
  const url = new URL(request.url);
  const record = asRecord(body);
  const data = asRecord(record?.data);

  return (
    numericPaymentId(data?.id) ??
    numericPaymentId(record?.id) ??
    numericPaymentId(url.searchParams.get("data.id")) ??
    numericPaymentId(url.searchParams.get("data_id")) ??
    numericPaymentId(url.searchParams.get("id"))
  );
}

export function extractNotificationType(request: Request, body: unknown): string | null {
  const url = new URL(request.url);
  const record = asRecord(body);
  const value =
    record?.type ?? record?.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");

  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

function parseSignature(signatureHeader: string | null) {
  if (!signatureHeader) return null;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const separator = part.indexOf("=");
      return separator === -1
        ? [part.trim(), ""]
        : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
    }),
  );
  if (!/^\d+$/.test(parts.ts ?? "") || !/^[a-f0-9]{64}$/i.test(parts.v1 ?? "")) {
    return null;
  }
  return { ts: parts.ts, v1: parts.v1.toLowerCase() };
}

export function buildMercadoPagoSignatureManifest(args: {
  dataId: string;
  requestId: string | null;
  ts: string;
}) {
  return `id:${args.dataId};${args.requestId ? `request-id:${args.requestId};` : ""}ts:${args.ts};`;
}

export function validateMercadoPagoSignature(args: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  const parsed = parseSignature(args.signatureHeader);
  if (!parsed || !numericPaymentId(args.dataId) || !args.secret) return false;

  const manifest = buildMercadoPagoSignatureManifest({
    dataId: args.dataId,
    requestId: args.requestId?.trim() || null,
    ts: parsed.ts,
  });
  const expected = createHmac("sha256", args.secret).update(manifest).digest("hex");
  const actualBuffer = Buffer.from(parsed.v1, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
