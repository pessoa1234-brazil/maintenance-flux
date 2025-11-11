-- Adicionar campo tipo_empreendimento à tabela empreendimentos
ALTER TABLE public.empreendimentos 
ADD COLUMN tipo_empreendimento text NOT NULL DEFAULT 'condominio' CHECK (tipo_empreendimento IN ('condominio', 'nao_condominio'));

-- Comentário explicativo
COMMENT ON COLUMN public.empreendimentos.tipo_empreendimento IS 'Tipo do empreendimento: condominio (permite cadastro de múltiplas unidades) ou nao_condominio (o próprio empreendimento é a unidade)';