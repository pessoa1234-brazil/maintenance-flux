-- Criar bucket de storage para manuais
INSERT INTO storage.buckets (id, name, public)
VALUES ('manuais', 'manuais', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para manuais
CREATE POLICY "Usuários autenticados podem fazer upload de manuais"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'manuais');

CREATE POLICY "Usuários autenticados podem ver seus manuais"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'manuais');

CREATE POLICY "Proprietários podem deletar manuais"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'manuais' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Adicionar campos de URL dos manuais na tabela empreendimentos
ALTER TABLE public.empreendimentos
ADD COLUMN IF NOT EXISTS manual_proprietario_url TEXT,
ADD COLUMN IF NOT EXISTS manual_condominio_url TEXT,
ADD COLUMN IF NOT EXISTS manual_usuario_url TEXT;

-- Criar tabela para armazenar conteúdo processado dos manuais
CREATE TABLE IF NOT EXISTS public.manuais_conteudo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  tipo_manual TEXT NOT NULL CHECK (tipo_manual IN ('proprietario', 'condominio', 'usuario')),
  arquivo_url TEXT NOT NULL,
  conteudo_extraido TEXT,
  status TEXT DEFAULT 'processando' CHECK (status IN ('processando', 'concluido', 'erro')),
  erro_mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_manuais_conteudo_empreendimento ON public.manuais_conteudo(empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_manuais_conteudo_tipo ON public.manuais_conteudo(tipo_manual);

-- RLS policies para manuais_conteudo
ALTER TABLE public.manuais_conteudo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver conteúdo de manuais"
ON public.manuais_conteudo FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários podem inserir conteúdo de manuais"
ON public.manuais_conteudo FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar conteúdo de manuais"
ON public.manuais_conteudo FOR UPDATE
TO authenticated
USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_manuais_conteudo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manuais_conteudo_timestamp
BEFORE UPDATE ON public.manuais_conteudo
FOR EACH ROW
EXECUTE FUNCTION public.update_manuais_conteudo_updated_at();