CREATE TABLE public.leads_checkout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  plano TEXT NOT NULL CHECK (plano IN ('diario', 'mensal', 'trimestral', 'anual')),
  idioma TEXT NOT NULL DEFAULT 'es' CHECK (idioma = 'es'),
  origem TEXT NOT NULL DEFAULT 'lp_espanhol' CHECK (origem = 'lp_espanhol'),
  status_venda TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status_venda IN ('pendente', 'concluida', 'recusada')),
  checkout_id TEXT,
  payment_id TEXT,
  payment_provider TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  fbclid TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  comprado_em TIMESTAMPTZ
);

ALTER TABLE public.leads_checkout ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.leads_checkout TO service_role;

CREATE POLICY "Admins view leads_checkout"
  ON public.leads_checkout FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX leads_checkout_status_criado_idx
  ON public.leads_checkout (status_venda, criado_em DESC);

CREATE INDEX leads_checkout_email_criado_idx
  ON public.leads_checkout (lower(email), criado_em DESC);

CREATE INDEX leads_checkout_payment_idx
  ON public.leads_checkout (payment_provider, payment_id);

CREATE OR REPLACE FUNCTION public.update_leads_checkout_atualizado_em()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_leads_checkout_atualizado_em
  BEFORE UPDATE ON public.leads_checkout
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leads_checkout_atualizado_em();
