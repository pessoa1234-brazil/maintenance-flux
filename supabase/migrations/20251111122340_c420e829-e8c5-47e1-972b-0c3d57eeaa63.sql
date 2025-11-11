-- Adicionar campos detalhados à tabela empreendimentos
ALTER TABLE public.empreendimentos
ADD COLUMN area_terreno DECIMAL(10,2),
ADD COLUMN numero_andares INTEGER,
ADD COLUMN numero_elevadores INTEGER,
ADD COLUMN numero_apartamentos INTEGER,
ADD COLUMN area_media_apartamentos DECIMAL(10,2),
ADD COLUMN data_habite_se DATE,
ADD COLUMN manual_proprietario TEXT,
ADD COLUMN manual_condominio TEXT,
ADD COLUMN manual_usuario TEXT;

-- Criar bucket de storage para fotos dos empreendimentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('empreendimentos', 'empreendimentos', true);

-- Políticas RLS para o bucket empreendimentos
-- Todos podem ver as fotos (bucket público)
CREATE POLICY "Fotos de empreendimentos são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'empreendimentos');

-- Construtoras podem fazer upload de fotos
CREATE POLICY "Construtoras podem fazer upload de fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'empreendimentos' 
  AND has_role(auth.uid(), 'construtora')
);

-- Construtoras podem atualizar fotos
CREATE POLICY "Construtoras podem atualizar fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'empreendimentos' 
  AND has_role(auth.uid(), 'construtora')
);

-- Construtoras podem deletar fotos
CREATE POLICY "Construtoras podem deletar fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'empreendimentos' 
  AND has_role(auth.uid(), 'construtora')
);

-- Criar tabela para especificações técnicas dos manuais (banco de dados consultável)
CREATE TABLE public.especificacoes_tecnicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL, -- ex: "hidráulica", "elétrica", "estrutural"
  item TEXT NOT NULL, -- ex: "cano PVC", "disjuntor"
  especificacao TEXT NOT NULL, -- detalhes técnicos
  fonte TEXT, -- "manual_proprietario", "manual_condominio", "manual_usuario"
  pagina INTEGER, -- número da página do manual
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para melhorar busca
CREATE INDEX idx_especificacoes_empreendimento ON public.especificacoes_tecnicas(empreendimento_id);
CREATE INDEX idx_especificacoes_categoria ON public.especificacoes_tecnicas(categoria);
CREATE INDEX idx_especificacoes_item ON public.especificacoes_tecnicas(item);

-- Enable RLS
ALTER TABLE public.especificacoes_tecnicas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para especificações técnicas
CREATE POLICY "Todos podem ver especificações"
ON public.especificacoes_tecnicas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Construtoras podem criar especificações"
ON public.especificacoes_tecnicas FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'construtora') AND
  EXISTS (
    SELECT 1 FROM public.empreendimentos 
    WHERE id = empreendimento_id AND construtora_id = auth.uid()
  )
);

CREATE POLICY "Construtoras podem atualizar especificações"
ON public.especificacoes_tecnicas FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'construtora') AND
  EXISTS (
    SELECT 1 FROM public.empreendimentos 
    WHERE id = empreendimento_id AND construtora_id = auth.uid()
  )
);

CREATE POLICY "Construtoras podem deletar especificações"
ON public.especificacoes_tecnicas FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'construtora') AND
  EXISTS (
    SELECT 1 FROM public.empreendimentos 
    WHERE id = empreendimento_id AND construtora_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_especificacoes_tecnicas_updated_at
BEFORE UPDATE ON public.especificacoes_tecnicas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();