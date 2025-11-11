-- Criar enum para classificação de serviços
CREATE TYPE public.tipo_servico AS ENUM ('garantia', 'manutencao_preventiva', 'servico_novo');

-- Adicionar classificação na tabela de ordens de serviço
ALTER TABLE public.ordens_servico
ADD COLUMN tipo_servico tipo_servico DEFAULT 'servico_novo',
ADD COLUMN sistema_predial TEXT,
ADD COLUMN prazo_atendimento_dias INTEGER,
ADD COLUMN data_limite_atendimento DATE;

-- Criar tabela de garantias NBR 17170:2022
CREATE TABLE public.garantias_nbr_17170 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sistema TEXT NOT NULL,
  subsistema TEXT,
  tipo_garantia TEXT NOT NULL, -- 'legal' ou 'oferecida'
  prazo_anos INTEGER NOT NULL,
  descricao TEXT,
  exemplos_falhas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para busca rápida
CREATE INDEX idx_garantias_sistema ON public.garantias_nbr_17170(sistema);
CREATE INDEX idx_garantias_tipo ON public.garantias_nbr_17170(tipo_garantia);

-- Enable RLS
ALTER TABLE public.garantias_nbr_17170 ENABLE ROW LEVEL SECURITY;

-- Política: todos usuários autenticados podem ver garantias
CREATE POLICY "Todos podem ver garantias NBR"
ON public.garantias_nbr_17170 FOR SELECT
TO authenticated
USING (true);

-- Política: apenas admins/construtoras podem gerenciar garantias
CREATE POLICY "Admins e construtoras podem gerenciar garantias"
ON public.garantias_nbr_17170 FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'construtora'));

-- Criar tabela de pagamentos
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, pago, cancelado
  metodo_pagamento TEXT,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  comprovante_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_pagamentos_os ON public.pagamentos(os_id);
CREATE INDEX idx_pagamentos_status ON public.pagamentos(status);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para pagamentos
CREATE POLICY "Usuários podem ver pagamentos relacionados"
ON public.pagamentos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ordens_servico
    WHERE id = os_id 
    AND (solicitante_id = auth.uid() OR prestador_id = auth.uid())
  )
);

CREATE POLICY "Sistema pode criar pagamentos"
ON public.pagamentos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ordens_servico
    WHERE id = os_id 
    AND (solicitante_id = auth.uid() OR prestador_id = auth.uid())
  )
);

CREATE POLICY "Solicitantes podem atualizar pagamentos"
ON public.pagamentos FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ordens_servico
    WHERE id = os_id AND solicitante_id = auth.uid()
  )
);

-- Trigger para updated_at em pagamentos
CREATE TRIGGER update_pagamentos_updated_at
BEFORE UPDATE ON public.pagamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de relatórios de conformidade
CREATE TABLE public.relatorios_conformidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  manutencoes_realizadas INTEGER DEFAULT 0,
  manutencoes_pendentes INTEGER DEFAULT 0,
  garantias_preservadas BOOLEAN DEFAULT true,
  observacoes TEXT,
  gerado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_relatorios_empreendimento ON public.relatorios_conformidade(empreendimento_id);
CREATE INDEX idx_relatorios_periodo ON public.relatorios_conformidade(periodo_inicio, periodo_fim);

ALTER TABLE public.relatorios_conformidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários vinculados veem relatórios"
ON public.relatorios_conformidade FOR SELECT
TO authenticated
USING (
  empreendimento_id IN (
    SELECT empreendimento_id FROM public.profiles WHERE id = auth.uid()
  )
  OR has_role(auth.uid(), 'construtora')
  OR has_role(auth.uid(), 'admin')
);

-- Adicionar campos obrigatórios para prestadores
ALTER TABLE public.ordens_servico
ADD COLUMN fotos_antes TEXT[],
ADD COLUMN fotos_depois TEXT[],
ADD COLUMN descricao_trabalho_realizado TEXT,
ADD COLUMN materiais_utilizados TEXT;

-- Inserir dados da NBR 17170:2022 (sistemas principais)
INSERT INTO public.garantias_nbr_17170 (sistema, subsistema, tipo_garantia, prazo_anos, descricao, exemplos_falhas) VALUES
-- Garantias Legais (5 anos)
('Estrutura', 'Fundações', 'legal', 5, 'Elementos de fundação e estrutura principal', 'Recalques, trincas estruturais, ruptura de elementos'),
('Estrutura', 'Elementos estruturais', 'legal', 5, 'Pilares, vigas, lajes', 'Fissuras comprometedoras, deformações excessivas'),
('Vedação Externa', 'Impermeabilização', 'legal', 5, 'Sistemas de impermeabilização de áreas molhadas', 'Infiltrações, umidade ascendente'),
('Vedação Externa', 'Fachadas', 'legal', 5, 'Sistemas de vedação externa', 'Destacamento de revestimentos, infiltrações'),

-- Garantias Oferecidas (1-3 anos típico)
('Instalações Hidráulicas', 'Água Fria', 'oferecida', 3, 'Tubulações, registros, conexões', 'Vazamentos, entupimentos, má pressão'),
('Instalações Hidráulicas', 'Água Quente', 'oferecida', 3, 'Sistema de aquecimento e distribuição', 'Vazamentos, aquecimento inadequado'),
('Instalações Hidráulicas', 'Esgoto', 'oferecida', 3, 'Sistema de coleta e afastamento', 'Entupimentos, refluxo, mau cheiro'),
('Instalações Elétricas', 'Distribuição', 'oferecida', 3, 'Quadros, circuitos, tomadas', 'Falhas elétricas, curtos, aquecimento'),
('Instalações Elétricas', 'Iluminação', 'oferecida', 2, 'Luminárias e pontos de luz', 'Falhas em interruptores, pontos sem energia'),

-- Sistemas Prediais
('Esquadrias', 'Portas', 'oferecida', 2, 'Portas internas e externas', 'Empenamento, ferragens soltas, vedação'),
('Esquadrias', 'Janelas', 'oferecida', 2, 'Janelas e caixilhos', 'Infiltração, mecanismos quebrados'),
('Revestimentos', 'Pisos', 'oferecida', 1, 'Pisos cerâmicos, porcelanato', 'Descolamento, trincas, desnivelamento'),
('Revestimentos', 'Paredes', 'oferecida', 1, 'Revestimentos de paredes', 'Descolamento, fissuras, manchas'),
('Revestimentos', 'Pintura', 'oferecida', 1, 'Pintura interna e externa', 'Descascamento, bolhas, manchas'),

-- Equipamentos
('Elevadores', 'Sistema completo', 'oferecida', 1, 'Elevadores e equipamentos', 'Falhas mecânicas, paradas frequentes'),
('Portões', 'Automatização', 'oferecida', 1, 'Portões e cancelas automáticas', 'Falhas no motor, sensores'),
('Interfone', 'Sistema', 'oferecida', 1, 'Sistema de interfonia e vídeo', 'Falhas de comunicação, imagem'),

-- Áreas Externas
('Paisagismo', 'Irrigação', 'oferecida', 1, 'Sistema de irrigação', 'Vazamentos, aspersores quebrados'),
('Drenagem', 'Águas Pluviais', 'oferecida', 3, 'Sistema de coleta de águas pluviais', 'Entupimentos, alagamentos'),

-- Sistemas Especiais
('Combate a Incêndio', 'Hidrantes', 'oferecida', 3, 'Sistema de hidrantes e sprinklers', 'Vazamentos, pressão inadequada'),
('Gás', 'Distribuição', 'oferecida', 3, 'Tubulação e medidores de gás', 'Vazamentos, conexões soltas'),
('Ar Condicionado', 'Sistema Central', 'oferecida', 2, 'Equipamentos de climatização', 'Falhas de resfriamento, vazamentos');

-- Função para calcular prazo de atendimento baseado no tipo de garantia
CREATE OR REPLACE FUNCTION public.calcular_prazo_atendimento(
  p_tipo_servico tipo_servico,
  p_sistema_predial TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prazo INTEGER;
  v_tipo_garantia TEXT;
BEGIN
  -- Se for garantia, buscar o tipo (legal ou oferecida)
  IF p_tipo_servico = 'garantia' THEN
    SELECT tipo_garantia INTO v_tipo_garantia
    FROM garantias_nbr_17170
    WHERE sistema = p_sistema_predial
    LIMIT 1;
    
    -- Prazos NBR 17170:2022
    -- Garantias legais (segurança/habitabilidade): 48h
    -- Garantias oferecidas: 15 dias
    IF v_tipo_garantia = 'legal' THEN
      v_prazo := 2; -- 2 dias (48 horas)
    ELSE
      v_prazo := 15; -- 15 dias
    END IF;
  ELSIF p_tipo_servico = 'manutencao_preventiva' THEN
    v_prazo := 30; -- 30 dias para manutenção preventiva
  ELSE
    v_prazo := NULL; -- Serviço novo: sem prazo obrigatório
  END IF;
  
  RETURN v_prazo;
END;
$$;