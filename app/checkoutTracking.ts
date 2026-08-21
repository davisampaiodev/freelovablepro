export type CheckoutTracking = {
  cid: string;
  fbclid?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  campaign_id?: string | null;
  adset_id?: string | null;
  ad_id?: string | null;
  meta_campaign_id?: string | null;
  meta_adset_id?: string | null;
  meta_ad_id?: string | null;
  src?: string | null;
  sck?: string | null;
  xcod?: string | null;
};

export function appendCheckoutTracking(
  url: URL,
  tracking: CheckoutTracking,
) {
  const checkoutUrl = new URL(url.toString());

  for (const [key, rawValue] of Object.entries(tracking)) {
    if (typeof rawValue !== "string") continue;
    const value = rawValue.trim();
    if (value) checkoutUrl.searchParams.set(key, value);
  }

  return checkoutUrl;
}
