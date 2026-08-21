ALTER TABLE public.checkout_sessions_v2
  ADD COLUMN IF NOT EXISTS meta_lead_event_id text,
  ADD COLUMN IF NOT EXISTS meta_lead_event_time bigint,
  ADD COLUMN IF NOT EXISTS meta_lead_status text,
  ADD COLUMN IF NOT EXISTS meta_lead_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_lead_last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS meta_lead_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS meta_lead_error text,
  ADD COLUMN IF NOT EXISTS meta_lead_response jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS checkout_sessions_v2_meta_lead_event_id_uidx
  ON public.checkout_sessions_v2 (meta_lead_event_id)
  WHERE meta_lead_event_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'checkout_sessions_v2_meta_lead_status_check'
      AND conrelid = 'public.checkout_sessions_v2'::regclass
  ) THEN
    ALTER TABLE public.checkout_sessions_v2
      ADD CONSTRAINT checkout_sessions_v2_meta_lead_status_check
      CHECK (meta_lead_status IS NULL OR meta_lead_status IN ('pending', 'sent', 'failed'));
  END IF;
END
$$;
