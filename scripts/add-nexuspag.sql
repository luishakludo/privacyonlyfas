-- ===========================================================
-- MIGRAÇÃO: Adiciona suporte a NexusPag
-- Rode este script APENAS se você já rodou o setup.sql antes
-- e quer adicionar a nova gateway NexusPag.
-- ===========================================================

-- Adiciona as novas configurações de gateway
INSERT INTO public.settings (key, value) VALUES ('nexuspag_secret_key', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('active_gateway', 'hyzepay') ON CONFLICT (key) DO NOTHING;

-- Adiciona coluna gateway na tabela payments (para saber qual gateway processou o pagamento)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway TEXT NOT NULL DEFAULT 'hyzepay';

-- ===========================================================
-- PRONTO! A NexusPag está configurada.
-- Acesse Integrações no painel admin para configurar sua chave.
-- ===========================================================
