ALTER TABLE public.checkout_sessions_v2
  ADD COLUMN IF NOT EXISTS meta_campaign_id text,
  ADD COLUMN IF NOT EXISTS meta_adset_id text,
  ADD COLUMN IF NOT EXISTS meta_ad_id text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS landing_page_url text,
  ADD COLUMN IF NOT EXISTS referrer_url text,
  ADD COLUMN IF NOT EXISTS xcod text;
