ALTER TABLE public.leads_checkout_br
  ADD COLUMN IF NOT EXISTS etapa_funil TEXT NOT NULL DEFAULT 'formulario_preenchido',
  ADD COLUMN IF NOT EXISTS pix_gerado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS valor NUMERIC,
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;

UPDATE public.leads_checkout_br
SET etapa_funil = 'pagamento_aprovado'
WHERE status IN ('aprovado', 'concluida');

UPDATE public.leads_checkout_br
SET etapa_funil = 'pix_gerado'
WHERE status = 'pendente'
  AND (
    checkout_id IS NOT NULL
    OR payment_id IS NOT NULL
    OR preference_id IS NOT NULL
    OR pagamento_mp_id IS NOT NULL
    OR payment_provider IS NOT NULL
  );

UPDATE public.leads_checkout_br
SET etapa_funil = 'formulario_preenchido'
WHERE status = 'pendente'
  AND checkout_id IS NULL
  AND payment_id IS NULL
  AND preference_id IS NULL
  AND pagamento_mp_id IS NULL
  AND payment_provider IS NULL;

CREATE OR REPLACE VIEW public.leads_formulario_sem_checkout AS
SELECT *
FROM public.leads_checkout_br
WHERE status = 'pendente'
  AND etapa_funil = 'formulario_preenchido'
  AND telefone IS NOT NULL
  AND length(regexp_replace(telefone, '\D', '', 'g')) >= 10;

CREATE OR REPLACE VIEW public.leads_pix_abandonado AS
SELECT *
FROM public.leads_checkout_br
WHERE status = 'pendente'
  AND etapa_funil = 'pix_gerado'
  AND telefone IS NOT NULL
  AND length(regexp_replace(telefone, '\D', '', 'g')) >= 10;
