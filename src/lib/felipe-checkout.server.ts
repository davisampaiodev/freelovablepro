const FUNCTION_NAMES = {
  createPayment: "mercadopago-create-payment-v2",
  createPreference: "mercadopago-create-preference-v2",
  paymentStatus: "mercadopago-payment-status-v2",
  webhook: "mercadopago-webhook-v2",
} as const;

export async function getFelipeFunctionUrl(
  functionName: (typeof FUNCTION_NAMES)[keyof typeof FUNCTION_NAMES],
) {
  const configuredUrl = (await getServerEnv("FELIPE_SUPABASE_URL"))
    .trim()
    .replace(/\/+$/, "");
  if (!configuredUrl) {
    throw new Error("Missing checkout environment variable: FELIPE_SUPABASE_URL");
  }
  const url = /^https?:\/\//i.test(configuredUrl)
    ? configuredUrl
    : `https://${configuredUrl}.supabase.co`;
  return `${url}/functions/v1/${functionName}`;
}

export async function getFelipeFunctionAuthHeaders() {
  const serviceRoleKey = (await getServerEnv("FELIPE_SUPABASE_SERVICE_ROLE_KEY")).trim();
  if (!serviceRoleKey) {
    throw new Error(
      "Missing checkout environment variable: FELIPE_SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return {
    Authorization: `Bearer ${serviceRoleKey}`,
    apikey: serviceRoleKey,
  };
}

export { FUNCTION_NAMES };
import { getServerEnv } from "@/lib/config.server";
