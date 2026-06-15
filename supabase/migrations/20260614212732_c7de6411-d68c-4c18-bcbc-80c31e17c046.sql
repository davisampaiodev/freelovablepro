ALTER TABLE public.tokens ADD COLUMN IF NOT EXISTS plano plano_tipo;
CREATE INDEX IF NOT EXISTS tokens_plano_status_idx ON public.tokens (plano, status);