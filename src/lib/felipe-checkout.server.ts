const FUNCTION_NAMES = {
  createPayment: "mercadopago-create-payment-v2",
  createPreference: "mercadopago-create-preference-v2",
  paymentStatus: "mercadopago-payment-status-v2",
  webhook: "mercadopago-webhook-v2",
} as const;

export function getFelipeFunctionUrl(
  functionName: (typeof FUNCTION_NAMES)[keyof typeof FUNCTION_NAMES],
) {
  const url = process.env.FELIPE_SUPABASE_URL?.trim().replace(/\/+$/, "");
  if (!url) throw new Error("Missing checkout environment variable: FELIPE_SUPABASE_URL");
  return `${url}/functions/v1/${functionName}`;
}

export { FUNCTION_NAMES };
