ALTER TABLE public.leads_checkout_br
  ADD COLUMN IF NOT EXISTS whatsapp_status TEXT NOT NULL DEFAULT 'nao_enviado',
  ADD COLUMN IF NOT EXISTS whatsapp_enviado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_tentativas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS checkout_abandono_msg TEXT;

CREATE OR REPLACE VIEW public.leads_formulario_sem_checkout_whatsapp AS
SELECT
  id,
  nome,
  email,
  telefone,
  plano,
  status,
  etapa_funil,
  criado_em,
  updated_at,
  whatsapp_status,
  whatsapp_tentativas
FROM public.leads_checkout_br
WHERE status = 'pendente'
  AND etapa_funil = 'formulario_preenchido'
  AND coalesce(whatsapp_status, 'nao_enviado') IN ('nao_enviado', 'erro')
  AND telefone IS NOT NULL
  AND length(regexp_replace(telefone, '\D', '', 'g')) >= 10;

CREATE OR REPLACE VIEW public.leads_checkout_iniciado_whatsapp AS
SELECT
  id,
  nome,
  email,
  telefone,
  plano,
  status,
  etapa_funil,
  checkout_id,
  payment_id,
  payment_provider,
  checkout_url,
  criado_em,
  updated_at,
  whatsapp_status,
  whatsapp_tentativas
FROM public.leads_checkout_br
WHERE status = 'pendente'
  AND etapa_funil = 'checkout_iniciado'
  AND coalesce(whatsapp_status, 'nao_enviado') IN ('nao_enviado', 'erro')
  AND telefone IS NOT NULL
  AND length(regexp_replace(telefone, '\D', '', 'g')) >= 10;

CREATE OR REPLACE VIEW public.leads_pix_abandonado_whatsapp AS
SELECT
  id,
  nome,
  email,
  telefone,
  plano,
  status,
  etapa_funil,
  checkout_id,
  payment_id,
  payment_provider,
  pix_gerado_em,
  checkout_url,
  valor,
  forma_pagamento,
  criado_em,
  updated_at,
  whatsapp_status,
  whatsapp_tentativas
FROM public.leads_checkout_br
WHERE status = 'pendente'
  AND etapa_funil = 'pix_gerado'
  AND coalesce(whatsapp_status, 'nao_enviado') IN ('nao_enviado', 'erro')
  AND telefone IS NOT NULL
  AND length(regexp_replace(telefone, '\D', '', 'g')) >= 10;
