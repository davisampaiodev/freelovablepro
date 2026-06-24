import process from "node:process";

const MP_BASE = "https://api.mercadopago.com";

export type PlanoKey = "diario" | "mensal" | "trimestral" | "anual";

export const PLANOS: Record<
  PlanoKey,
  { titulo: string; centavos: number; dias: number }
> = {
  diario: { titulo: "Plano Diário", centavos: 990, dias: 1 },
  mensal: { titulo: "Plano Mensal", centavos: 4990, dias: 30 },
  trimestral: { titulo: "Plano Trimestral", centavos: 12700, dias: 90 },
  anual: { titulo: "Plano Anual", centavos: 29700, dias: 365 },
};

function getToken(): string {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("MP_ACCESS_TOKEN não configurado");
  return t;
}

export interface CreatePreferenceInput {
  assinaturaId: string;
  plano: PlanoKey;
  nome: string;
  email: string;
  siteUrl: string;
  notificationUrl: string;
}

export async function createPreference(
  input: CreatePreferenceInput,
): Promise<{ id: string; init_point: string; sandbox_init_point: string }> {
  const plano = PLANOS[input.plano];
  const body = {
    items: [
      {
        id: input.plano,
        title: plano.titulo,
        quantity: 1,
        unit_price: plano.centavos / 100,
        currency_id: "BRL",
      },
    ],
    payer: { name: input.nome, email: input.email },
    external_reference: input.assinaturaId,
    notification_url: input.notificationUrl,
    // IMPORTANTE: back_urls SEM query strings — MP silenciosamente ignora
    // `auto_return` quando alguma URL contém `?`, o que faz o usuário ficar
    // preso na tela do MP após pagar.
    back_urls: {
      success: `${input.siteUrl}/obrigado`,
      pending: `${input.siteUrl}/obrigado`,
      failure: `${input.siteUrl}/`,
    },
    auto_return: "approved",
    metadata: { assinatura_id: input.assinaturaId, plano: input.plano },
  };

  const res = await fetch(`${MP_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MP preference falhou ${res.status}: ${text}`);
  }
  return (await res.json()) as {
    id: string;
    init_point: string;
    sandbox_init_point: string;
  };
}

export interface MpPayment {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string | null;
  payment_method_id?: string;
  payment_type_id?: string;
  transaction_amount?: number;
  payer?: { email?: string };
  metadata?: Record<string, unknown>;
}

export async function getPayment(paymentId: string): Promise<MpPayment> {
  const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MP getPayment falhou ${res.status}: ${text}`);
  }
  return (await res.json()) as MpPayment;
}

/**
 * Verifica assinatura do webhook do MP.
 * Algoritmo: HMAC-SHA256( "id:<dataId>;request-id:<xRequestId>;ts:<ts>;", MP_WEBHOOK_SECRET )
 * Header x-signature: "ts=<ts>,v1=<hash>"
 */
export async function verifyMpSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): Promise<boolean> {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("MP_WEBHOOK_SECRET ausente — pulando verificação de assinatura");
    return true;
  }
  if (!params.xSignature || !params.xRequestId || !params.dataId) return false;

  const parts = Object.fromEntries(
    params.xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim() ?? ""];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${params.dataId};request-id:${params.xRequestId};ts:${ts};`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(manifest));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // timing-safe compare
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}
