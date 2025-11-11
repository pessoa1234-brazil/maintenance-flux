-- Criar tabela de avaliações de prestadores
CREATE TABLE public.avaliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  prestador_id UUID NOT NULL,
  avaliador_id UUID NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_avaliacoes_prestador ON public.avaliacoes(prestador_id);
CREATE INDEX idx_avaliacoes_os ON public.avaliacoes(os_id);

-- RLS para avaliacoes
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver avaliações de prestadores"
  ON public.avaliacoes FOR SELECT
  USING (true);

CREATE POLICY "Solicitantes podem criar avaliações"
  ON public.avaliacoes FOR INSERT
  WITH CHECK (
    avaliador_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM ordens_servico 
      WHERE id = os_id 
      AND solicitante_id = auth.uid()
      AND status = 'CONCLUIDA'
    )
  );

-- Criar tabela de mensagens de chat
CREATE TABLE public.mensagens_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  remetente_id UUID NOT NULL,
  destinatario_id UUID NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para chat
CREATE INDEX idx_mensagens_os ON public.mensagens_chat(os_id);
CREATE INDEX idx_mensagens_remetente ON public.mensagens_chat(remetente_id);
CREATE INDEX idx_mensagens_destinatario ON public.mensagens_chat(destinatario_id);
CREATE INDEX idx_mensagens_created ON public.mensagens_chat(created_at DESC);

-- RLS para mensagens
ALTER TABLE public.mensagens_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas mensagens"
  ON public.mensagens_chat FOR SELECT
  USING (
    remetente_id = auth.uid() OR 
    destinatario_id = auth.uid()
  );

CREATE POLICY "Usuários podem enviar mensagens"
  ON public.mensagens_chat FOR INSERT
  WITH CHECK (
    remetente_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM ordens_servico 
      WHERE id = os_id 
      AND (solicitante_id = auth.uid() OR prestador_id = auth.uid())
    )
  );

CREATE POLICY "Usuários podem atualizar suas mensagens recebidas"
  ON public.mensagens_chat FOR UPDATE
  USING (destinatario_id = auth.uid());

-- Trigger para updated_at em avaliacoes
CREATE TRIGGER update_avaliacoes_updated_at
  BEFORE UPDATE ON public.avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_chat;

-- Adicionar campo de nota média ao profiles (cache denormalizado)
ALTER TABLE public.profiles ADD COLUMN nota_media NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN total_avaliacoes INTEGER DEFAULT 0;

-- Função para atualizar nota média do prestador
CREATE OR REPLACE FUNCTION public.atualizar_nota_prestador()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET 
    nota_media = (
      SELECT COALESCE(AVG(nota), 0)
      FROM avaliacoes
      WHERE prestador_id = NEW.prestador_id
    ),
    total_avaliacoes = (
      SELECT COUNT(*)
      FROM avaliacoes
      WHERE prestador_id = NEW.prestador_id
    )
  WHERE id = NEW.prestador_id;
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar nota após inserção/atualização de avaliação
CREATE TRIGGER trigger_atualizar_nota_prestador
  AFTER INSERT OR UPDATE ON public.avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_nota_prestador();

-- Adicionar campos de estatísticas nas ordens_servico
ALTER TABLE public.ordens_servico 
  ADD COLUMN tempo_resposta_horas INTEGER,
  ADD COLUMN tempo_conclusao_dias INTEGER;

-- Função para calcular estatísticas quando OS é atualizada
CREATE OR REPLACE FUNCTION public.calcular_estatisticas_os()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calcular tempo de resposta (quando prestador é atribuído)
  IF NEW.prestador_id IS NOT NULL AND OLD.prestador_id IS NULL THEN
    NEW.tempo_resposta_horas := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 3600;
  END IF;
  
  -- Calcular tempo de conclusão
  IF NEW.status = 'CONCLUIDA' AND NEW.data_conclusao IS NOT NULL THEN
    NEW.tempo_conclusao_dias := EXTRACT(EPOCH FROM (NEW.data_conclusao - NEW.data_solicitacao)) / 86400;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calcular_estatisticas_os
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.calcular_estatisticas_os();
