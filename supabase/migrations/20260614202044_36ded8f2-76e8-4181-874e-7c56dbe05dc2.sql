
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Tokens pool
CREATE TYPE public.token_status AS ENUM ('disponivel', 'usado');

CREATE TABLE public.tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  status public.token_status NOT NULL DEFAULT 'disponivel',
  assinatura_id UUID,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  usado_em TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tokens TO authenticated;
GRANT ALL ON public.tokens TO service_role;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tokens"
  ON public.tokens FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX tokens_status_idx ON public.tokens (status, criado_em);

-- Assinaturas
CREATE TYPE public.plano_tipo AS ENUM ('diario', 'mensal', 'trimestral', 'anual');
CREATE TYPE public.assinatura_status AS ENUM ('pendente', 'aprovado', 'rejeitado', 'expirado');

CREATE TABLE public.assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  plano public.plano_tipo NOT NULL,
  status public.assinatura_status NOT NULL DEFAULT 'pendente',
  token_id UUID REFERENCES public.tokens(id) ON DELETE SET NULL,
  token_valor TEXT,
  expira_em TIMESTAMPTZ,
  pagamento_mp_id TEXT,
  preference_id TEXT,
  valor_centavos INTEGER NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assinaturas TO authenticated;
GRANT ALL ON public.assinaturas TO service_role;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all assinaturas"
  ON public.assinaturas FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX assinaturas_status_idx ON public.assinaturas (status, criado_em DESC);
CREATE INDEX assinaturas_mp_id_idx ON public.assinaturas (pagamento_mp_id);

CREATE TRIGGER update_assinaturas_updated_at
  BEFORE UPDATE ON public.assinaturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FK from tokens -> assinaturas (added after both exist)
ALTER TABLE public.tokens
  ADD CONSTRAINT tokens_assinatura_fk
  FOREIGN KEY (assinatura_id) REFERENCES public.assinaturas(id) ON DELETE SET NULL;
