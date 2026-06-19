const STRIPE_API = "https://api.stripe.com/v1";

export type PlanoKey = "diario" | "mensal" | "trimestral" | "anual";

const PRICE_ENV_BY_PLAN: Record<PlanoKey, string> = {
  diario: "STRIPE_PRICE_DIARIO",
  mensal: "STRIPE_PRICE_MENSAL",
  trimestral: "STRIPE_PRICE_TRIMESTRAL",
  anual: "STRIPE_PRICE_ANUAL",
};

function stripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY não configurada");
  return secretKey;
}

function stripePriceId(plano: PlanoKey) {
  const environmentName = PRICE_ENV_BY_PLAN[plano];
  const priceId = process.env[environmentName];
  if (!priceId) throw new Error(`${environmentName} não configurada`);
  return priceId;
}

async function stripeRequest<T>(
  path: string,
  init?: Omit<RequestInit, "headers"> & { headers?: Record<string, string> },
) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${stripeSecretKey()}`,
      ...init?.headers,
    },
  });

  const body = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(
      `Stripe API ${response.status}: ${body.error?.message || "erro desconhecido"}`,
    );
  }
  return body as T;
}

export async function createStripeCheckoutSession(input: {
  leadId: string;
  plano: PlanoKey;
  email: string;
  siteUrl: string;
}) {
  const priceId = stripePriceId(input.plano);
  const price = await stripeRequest<{ currency: string }>(
    `/prices/${encodeURIComponent(priceId)}`,
  );

  if (price.currency?.toLowerCase() !== "eur") {
    throw new Error(`O Price ID de ${input.plano} não está configurado em EUR`);
  }

  const form = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    client_reference_id: input.leadId,
    "metadata[lead_id]": input.leadId,
    "metadata[plano]": input.plano,
    "payment_intent_data[metadata][lead_id]": input.leadId,
    "payment_intent_data[metadata][plano]": input.plano,
    customer_email: input.email,
    locale: "es",
    success_url: `${input.siteUrl}/obrigado?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.siteUrl}/#planos`,
  });

  return stripeRequest<{ id: string; url: string | null }>(
    "/checkout/sessions",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    },
  );
}
