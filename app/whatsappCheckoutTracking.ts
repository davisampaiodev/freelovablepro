export type GGCheckoutTracking = {
  src?: string | null;
  sck?: string | null;
  xcod?: string | null;
  fbclid?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  campaign_id?: string | null;
  adset_id?: string | null;
  ad_id?: string | null;
  meta_campaign_id?: string | null;
  meta_adset_id?: string | null;
  meta_ad_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
};

const GG_CHECKOUT_TRACKING_KEYS = [
  "src",
  "sck",
  "xcod",
  "fbclid",
  "fbc",
  "fbp",
  "campaign_id",
  "adset_id",
  "ad_id",
  "meta_campaign_id",
  "meta_adset_id",
  "meta_ad_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export function appendGGCheckoutTracking(
  url: URL,
  tracking: GGCheckoutTracking,
) {
  const checkoutUrl = new URL(url.toString());

  for (const key of GG_CHECKOUT_TRACKING_KEYS) {
    const rawValue = tracking[key];
    if (typeof rawValue !== "string") continue;
    const value = rawValue.trim();
    if (value) checkoutUrl.searchParams.set(key, value);
  }

  return checkoutUrl;
}
