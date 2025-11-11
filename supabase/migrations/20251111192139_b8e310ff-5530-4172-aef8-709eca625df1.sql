-- Criar tabela para histórico de buscas em manuais
CREATE TABLE IF NOT EXISTS historico_buscas_manuais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES empreendimentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  tipo_manual TEXT,
  referencias TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_historico_buscas_empreendimento ON historico_buscas_manuais(empreendimento_id);
CREATE INDEX idx_historico_buscas_user ON historico_buscas_manuais(user_id);
CREATE INDEX idx_historico_buscas_created ON historico_buscas_manuais(created_at DESC);

-- RLS policies
ALTER TABLE historico_buscas_manuais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio histórico"
  ON historico_buscas_manuais
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar histórico"
  ON historico_buscas_manuais
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Criar tabela para dados estruturados extraídos dos manuais
CREATE TABLE IF NOT EXISTS manual_dados_estruturados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES empreendimentos(id) ON DELETE CASCADE,
  tipo_manual TEXT NOT NULL,
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  chave TEXT NOT NULL,
  valor TEXT NOT NULL,
  unidade TEXT,
  pagina INTEGER,
  secao TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para dados estruturados
CREATE INDEX idx_manual_dados_empreendimento ON manual_dados_estruturados(empreendimento_id);
CREATE INDEX idx_manual_dados_tipo ON manual_dados_estruturados(tipo_manual);
CREATE INDEX idx_manual_dados_categoria ON manual_dados_estruturados(categoria);
CREATE INDEX idx_manual_dados_chave ON manual_dados_estruturados(chave);

-- RLS policies para dados estruturados
ALTER TABLE manual_dados_estruturados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver dados estruturados"
  ON manual_dados_estruturados
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode inserir dados estruturados"
  ON manual_dados_estruturados
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar dados estruturados"
  ON manual_dados_estruturados
  FOR UPDATE
  USING (true);