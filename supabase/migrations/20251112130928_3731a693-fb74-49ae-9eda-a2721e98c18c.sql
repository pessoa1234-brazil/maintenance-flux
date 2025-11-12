-- Criar tabela para armazenar conteúdo estruturado dos manuais do proprietário
CREATE TABLE IF NOT EXISTS manual_proprietario_conteudo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES empreendimentos(id) ON DELETE CASCADE,
  
  -- Metadados do documento
  id_documento TEXT,
  tipo_documento TEXT DEFAULT 'Manual do Proprietário',
  data_documento TEXT,
  
  -- Estrutura hierárquica do manual
  secao TEXT NOT NULL, -- Ex: "1. Metadados", "2. Dados do Imóvel", "3. Garantias"
  subsecao TEXT, -- Ex: "3.1 Estrutura", "3.2 Instalações"
  ordem INTEGER NOT NULL DEFAULT 0,
  
  -- Conteúdo
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL, -- Rich text/HTML
  tipo_conteudo TEXT DEFAULT 'texto', -- texto, tabela, lista, imagem
  
  -- Dados estruturados (JSON para flexibilidade)
  dados_estruturados JSONB, -- Para tabelas, listas, dados específicos
  
  -- Controle
  editavel BOOLEAN DEFAULT true,
  visivel BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_manual_proprietario_empreendimento ON manual_proprietario_conteudo(empreendimento_id);
CREATE INDEX idx_manual_proprietario_secao ON manual_proprietario_conteudo(secao, ordem);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_manual_proprietario_updated_at
  BEFORE UPDATE ON manual_proprietario_conteudo
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE manual_proprietario_conteudo ENABLE ROW LEVEL SECURITY;

-- Construtoras podem criar e editar manuais de seus empreendimentos
CREATE POLICY "Construtoras podem gerenciar manuais de seus empreendimentos"
  ON manual_proprietario_conteudo
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM empreendimentos 
      WHERE empreendimentos.id = manual_proprietario_conteudo.empreendimento_id 
      AND empreendimentos.construtora_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM empreendimentos 
      WHERE empreendimentos.id = manual_proprietario_conteudo.empreendimento_id 
      AND empreendimentos.construtora_id = auth.uid()
    )
  );

-- Usuários vinculados podem ver manuais
CREATE POLICY "Usuários vinculados podem ver manuais"
  ON manual_proprietario_conteudo
  FOR SELECT
  USING (
    empreendimento_id IN (
      SELECT empreendimento_id FROM profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM empreendimentos 
      WHERE empreendimentos.id = manual_proprietario_conteudo.empreendimento_id 
      AND empreendimentos.construtora_id = auth.uid()
    )
  );

-- Criar tabela para templates/seções padrão do manual
CREATE TABLE IF NOT EXISTS manual_proprietario_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secao TEXT NOT NULL,
  subsecao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  titulo TEXT NOT NULL,
  descricao TEXT,
  conteudo_padrao TEXT, -- Conteúdo template/placeholder
  tipo_conteudo TEXT DEFAULT 'texto',
  obrigatorio BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir templates padrão baseados no documento
INSERT INTO manual_proprietario_templates (secao, subsecao, ordem, titulo, descricao, tipo_conteudo, obrigatorio) VALUES
('1', 'Metadados', 1, 'Identificação do Documento', 'ID, tipo, data e empresas associadas', 'texto', true),
('2', 'Dados do Imóvel', 1, 'Descrição Base', 'Descrição geral do imóvel', 'texto', true),
('2', 'Dados do Imóvel', 2, 'Endereço Completo', 'Logradouro, condomínio, localização', 'texto', true),
('2', 'Dados do Imóvel', 3, 'Áreas Detalhadas', 'Tabela com áreas do terreno e construção', 'tabela', true),
('3', 'Definições', 1, 'Normas e Terminologia', 'Definições ABNT e termos técnicos', 'lista', true),
('4', 'Garantias', 1, 'Prazos de Garantia', 'Tabela de garantias por sistema predial', 'tabela', true),
('4', 'Garantias', 2, 'Condições de Garantia', 'Condições para manutenção da garantia', 'texto', true),
('5', 'Sistemas Prediais', 1, 'Estrutura', 'Informações sobre estrutura do imóvel', 'texto', false),
('5', 'Sistemas Prediais', 2, 'Instalações Elétricas', 'Especificações elétricas', 'texto', false),
('5', 'Sistemas Prediais', 3, 'Instalações Hidrossanitárias', 'Especificações hidráulicas', 'texto', false),
('5', 'Sistemas Prediais', 4, 'Revestimentos', 'Informações sobre acabamentos', 'texto', false),
('6', 'Manutenção', 1, 'Cronograma de Manutenção', 'Tabela com atividades preventivas', 'tabela', true),
('6', 'Manutenção', 2, 'Instruções de Uso', 'Como usar corretamente cada sistema', 'lista', true),
('7', 'Contatos', 1, 'Empresas Responsáveis', 'Contatos da construtora e administradora', 'texto', true),
('7', 'Contatos', 2, 'Prestadores Recomendados', 'Lista de prestadores qualificados', 'lista', false);

-- RLS para templates (somente leitura para todos autenticados)
ALTER TABLE manual_proprietario_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates são públicos para autenticados"
  ON manual_proprietario_templates
  FOR SELECT
  USING (auth.role() = 'authenticated');