-- ===========================================================
-- SETUP COMPLETO DO BANCO — RODE APENAS ESTE SCRIPT
-- Execute no SQL Editor do Supabase (uma única vez)
-- ===========================================================

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================================
-- 1) TABELA: models (modelos / páginas)
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  handle TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('online', 'rascunho')),
  active BOOLEAN NOT NULL DEFAULT true,
  views BIGINT NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  avatar_url TEXT,
  bio TEXT,
  pixel_facebook TEXT,
  pixel_utmify TEXT,
  config JSONB NOT NULL DEFAULT '{
    "banner": { "title": "", "subtitle": "", "imageUrl": "" },
    "social": { "instagram": "", "twitter": "", "tiktok": "", "onlyfans": "", "privacy": "" },
    "plans": [],
    "gallery": [],
    "testimonials": [],
    "faq": [],
    "theme": { "backgroundColor": "#0a0a0a", "textColor": "#ffffff", "accentColor": "#ec4899", "cardBackground": "#171717" },
    "checkout": { "title": "Finalizar Pedido", "subtitle": "Digite seu e-mail para receber o acesso.", "orderBumps": [] }
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Colunas extras (caso tabela já exista)
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS pixel_facebook TEXT;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS pixel_utmify TEXT;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_models_slug ON public.models(slug);
CREATE INDEX IF NOT EXISTS idx_models_handle ON public.models(handle);

-- ===========================================================
-- 2) TABELA: settings (chaves de gateways + senha admin)
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Valores iniciais
INSERT INTO public.settings (key, value) VALUES ('hyzepay_public_key', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('hyzepay_secret_key', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('nexuspag_secret_key', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('active_gateway', 'hyzepay') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('admin_password', '16102812') ON CONFLICT (key) DO NOTHING;

-- ===========================================================
-- 3) TABELA: payments (pagamentos PIX)
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
  email TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'estornado', 'cancelado')),
  method TEXT NOT NULL DEFAULT 'pix',
  gateway TEXT NOT NULL DEFAULT 'hyzepay',
  customer TEXT,
  plan_name TEXT,
  bumps JSONB NOT NULL DEFAULT '[]'::jsonb,
  transaction_id TEXT,
  external_id TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- Colunas extras (caso tabela já exista)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS bumps JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway TEXT NOT NULL DEFAULT 'hyzepay';

CREATE INDEX IF NOT EXISTS payments_model_id_idx ON public.payments(model_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);
CREATE INDEX IF NOT EXISTS payments_external_id_idx ON public.payments(external_id);
CREATE INDEX IF NOT EXISTS payments_transaction_id_idx ON public.payments(transaction_id);

-- ===========================================================
-- 4) TABELA: content (conteúdo das páginas)
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'text', 'gallery', 'video')),
  title TEXT,
  body TEXT,
  media_url TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_model ON public.content(model_id);

-- ===========================================================
-- 5) TABELA: visits (analytics)
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_model ON public.visits(model_id);

-- ===========================================================
-- 6) TRIGGERS: updated_at automático
-- ===========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_models_updated_at ON public.models;
CREATE TRIGGER trg_models_updated_at
  BEFORE UPDATE ON public.models
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_settings_updated_at ON public.settings;
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===========================================================
-- 7) STORAGE: bucket para imagens
-- ===========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('model-media', 'model-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas do bucket
DROP POLICY IF EXISTS "model-media public read" ON storage.objects;
CREATE POLICY "model-media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'model-media');

DROP POLICY IF EXISTS "model-media write" ON storage.objects;
CREATE POLICY "model-media write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'model-media');

DROP POLICY IF EXISTS "model-media update" ON storage.objects;
CREATE POLICY "model-media update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'model-media');

DROP POLICY IF EXISTS "model-media delete" ON storage.objects;
CREATE POLICY "model-media delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'model-media');

-- ===========================================================
-- 8) ROW LEVEL SECURITY (RLS)
-- ===========================================================
ALTER TABLE public.models   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits   ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (anon key liberada — ajuste em produção)
DROP POLICY IF EXISTS models_all ON public.models;
CREATE POLICY models_all ON public.models FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS settings_all ON public.settings;
CREATE POLICY settings_all ON public.settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS payments_all ON public.payments;
CREATE POLICY payments_all ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS content_all ON public.content;
CREATE POLICY content_all ON public.content FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS visits_all ON public.visits;
CREATE POLICY visits_all ON public.visits FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================
-- PRONTO! Rode este script UMA vez no SQL Editor do Supabase.
-- ===========================================================
