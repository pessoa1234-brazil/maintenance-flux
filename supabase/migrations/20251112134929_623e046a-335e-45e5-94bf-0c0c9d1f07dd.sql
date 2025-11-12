-- Adicionar constraint única antes de inserir templates
ALTER TABLE manual_proprietario_templates 
ADD CONSTRAINT unique_template_secao_subsecao_titulo 
UNIQUE (secao, subsecao, titulo);

-- Inserir templates completos para Manual do Proprietário
INSERT INTO manual_proprietario_templates (secao, subsecao, ordem, titulo, descricao, tipo_conteudo, obrigatorio) VALUES
-- Seção 1: Identificação
('1', 'Empreendimento', 2, 'Dados do Empreendimento', 'Nome, endereço e características gerais do empreendimento', 'texto', true),
('1', 'Responsáveis', 3, 'Equipe Técnica', 'Dados dos responsáveis técnicos pela construção', 'tabela', true),

-- Seção 2: Características da Edificação  
('2', 'Dados do Imóvel', 1, 'Descrição Geral', 'Descrição completa da unidade/edificação', 'texto', true),
('2', 'Dados do Imóvel', 2, 'Localização', 'Endereço completo e referências', 'texto', true),
('2', 'Dados do Imóvel', 3, 'Áreas', 'Áreas totais, privativas e comuns', 'tabela', true),
('2', 'Sistemas', 4, 'Sistemas Construtivos', 'Descrição dos sistemas construtivos utilizados', 'texto', true),

-- Seção 3: Instruções de Uso
('3', 'Instruções Gerais', 1, 'Orientações de Uso', 'Instruções gerais para uso adequado da edificação', 'texto', true),
('3', 'Sistemas Elétricos', 2, 'Sistema Elétrico', 'Instruções para uso do sistema elétrico', 'texto', true),
('3', 'Sistemas Hidráulicos', 3, 'Sistema Hidrossanitário', 'Instruções para uso dos sistemas hidráulicos', 'texto', true),
('3', 'Climatização', 4, 'Ar Condicionado e Ventilação', 'Instruções para sistemas de climatização', 'texto', false),
('3', 'Esquadrias', 5, 'Portas e Janelas', 'Instruções de uso e cuidados com esquadrias', 'texto', true),
('3', 'Revestimentos', 6, 'Pisos e Revestimentos', 'Cuidados com pisos e revestimentos', 'texto', true),

-- Seção 4: Operação e Manutenção
('4', 'Manutenção Preventiva', 1, 'Programa de Manutenção', 'Cronograma de manutenções preventivas obrigatórias', 'tabela', true),
('4', 'Manutenção Preventiva', 2, 'Periodicidade', 'Tabela com periodicidade das manutenções por sistema', 'tabela', true),
('4', 'Cuidados', 3, 'Recomendações Gerais', 'Cuidados gerais para preservação da edificação', 'lista', true),
('4', 'Vedações', 4, 'Manutenção de Vedações', 'Cuidados com impermeabilizações e vedações', 'texto', true),

-- Seção 5: Garantias
('5', 'Prazos', 1, 'Garantias Legais', 'Prazos de garantia conforme ABNT NBR 17170', 'tabela', true),
('5', 'Condições', 2, 'Condições de Garantia', 'Condições para manutenção da garantia', 'lista', true),
('5', 'Contatos', 3, 'Canais de Atendimento', 'Contatos para acionamento de garantia', 'texto', true),

-- Seção 6: Segurança
('6', 'Prevenção', 1, 'Medidas de Segurança', 'Orientações gerais de segurança', 'lista', true),
('6', 'Emergências', 2, 'Procedimentos de Emergência', 'Instruções para situações de emergência', 'texto', true),
('6', 'Equipamentos', 3, 'Equipamentos de Segurança', 'Localização e uso de equipamentos de segurança', 'texto', true),

-- Seção 7: Anexos
('7', 'Documentos', 1, 'Documentação Técnica', 'Projetos, laudos e documentos técnicos', 'texto', false),
('7', 'Contatos', 2, 'Lista de Contatos', 'Contatos de fornecedores e prestadores', 'tabela', false),
('7', 'Plantas', 3, 'Plantas e Diagramas', 'Plantas baixas e diagramas técnicos', 'texto', false)

ON CONFLICT (secao, subsecao, titulo) DO NOTHING;

-- Criar tabela para histórico de versões do manual
CREATE TABLE IF NOT EXISTS manual_proprietario_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES empreendimentos(id) ON DELETE CASCADE,
  conteudo_id UUID NOT NULL REFERENCES manual_proprietario_conteudo(id) ON DELETE CASCADE,
  campo_alterado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  motivo_alteracao TEXT,
  versao INTEGER NOT NULL DEFAULT 1,
  alterado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_historico_conteudo ON manual_proprietario_historico(conteudo_id);
CREATE INDEX IF NOT EXISTS idx_historico_empreendimento ON manual_proprietario_historico(empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_historico_created ON manual_proprietario_historico(created_at DESC);

-- RLS policies para histórico
ALTER TABLE manual_proprietario_historico ENABLE ROW LEVEL SECURITY;

-- Construtoras podem ver histórico de seus empreendimentos
CREATE POLICY "Construtoras podem ver histórico de seus empreendimentos"
ON manual_proprietario_historico
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM empreendimentos
    WHERE empreendimentos.id = manual_proprietario_historico.empreendimento_id
    AND empreendimentos.construtora_id = auth.uid()
  )
);

-- Sistema pode inserir histórico automaticamente
CREATE POLICY "Sistema pode inserir histórico"
ON manual_proprietario_historico
FOR INSERT
WITH CHECK (true);

-- Trigger para registrar alterações automaticamente
CREATE OR REPLACE FUNCTION registrar_historico_manual()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.titulo IS DISTINCT FROM NEW.titulo) THEN
      INSERT INTO manual_proprietario_historico 
        (empreendimento_id, conteudo_id, campo_alterado, valor_anterior, valor_novo, alterado_por, versao)
      VALUES 
        (NEW.empreendimento_id, NEW.id, 'titulo', OLD.titulo, NEW.titulo, NEW.updated_by, 
         COALESCE((SELECT MAX(versao) FROM manual_proprietario_historico WHERE conteudo_id = NEW.id), 0) + 1);
    END IF;
    
    IF (OLD.conteudo IS DISTINCT FROM NEW.conteudo) THEN
      INSERT INTO manual_proprietario_historico 
        (empreendimento_id, conteudo_id, campo_alterado, valor_anterior, valor_novo, alterado_por, versao)
      VALUES 
        (NEW.empreendimento_id, NEW.id, 'conteudo', 
         LEFT(OLD.conteudo, 500), LEFT(NEW.conteudo, 500), NEW.updated_by,
         COALESCE((SELECT MAX(versao) FROM manual_proprietario_historico WHERE conteudo_id = NEW.id), 0) + 1);
    END IF;
    
    IF (OLD.visivel IS DISTINCT FROM NEW.visivel) THEN
      INSERT INTO manual_proprietario_historico 
        (empreendimento_id, conteudo_id, campo_alterado, valor_anterior, valor_novo, alterado_por, versao)
      VALUES 
        (NEW.empreendimento_id, NEW.id, 'visivel', OLD.visivel::TEXT, NEW.visivel::TEXT, NEW.updated_by,
         COALESCE((SELECT MAX(versao) FROM manual_proprietario_historico WHERE conteudo_id = NEW.id), 0) + 1);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger na tabela de conteúdo
DROP TRIGGER IF EXISTS trigger_historico_manual ON manual_proprietario_conteudo;
CREATE TRIGGER trigger_historico_manual
  AFTER UPDATE ON manual_proprietario_conteudo
  FOR EACH ROW
  EXECUTE FUNCTION registrar_historico_manual();