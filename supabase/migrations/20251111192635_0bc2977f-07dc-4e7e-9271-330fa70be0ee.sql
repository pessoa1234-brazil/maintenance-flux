-- Criar tabela para histórico de alterações dos dados estruturados
CREATE TABLE IF NOT EXISTS manual_dados_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dado_id UUID NOT NULL REFERENCES manual_dados_estruturados(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  campo_alterado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_historico_dado ON manual_dados_historico(dado_id);
CREATE INDEX idx_historico_user ON manual_dados_historico(user_id);
CREATE INDEX idx_historico_created ON manual_dados_historico(created_at DESC);

-- RLS policies
ALTER TABLE manual_dados_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver histórico"
  ON manual_dados_historico
  FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem criar histórico"
  ON manual_dados_historico
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Adicionar trigger para criar histórico automaticamente quando dados são atualizados
CREATE OR REPLACE FUNCTION registrar_alteracao_dado_estruturado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Registrar alteração de chave
  IF OLD.chave IS DISTINCT FROM NEW.chave THEN
    INSERT INTO manual_dados_historico (dado_id, user_id, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, auth.uid(), 'chave', OLD.chave, NEW.chave);
  END IF;

  -- Registrar alteração de valor
  IF OLD.valor IS DISTINCT FROM NEW.valor THEN
    INSERT INTO manual_dados_historico (dado_id, user_id, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, auth.uid(), 'valor', OLD.valor, NEW.valor);
  END IF;

  -- Registrar alteração de categoria
  IF OLD.categoria IS DISTINCT FROM NEW.categoria THEN
    INSERT INTO manual_dados_historico (dado_id, user_id, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, auth.uid(), 'categoria', OLD.categoria, NEW.categoria);
  END IF;

  -- Registrar alteração de subcategoria
  IF OLD.subcategoria IS DISTINCT FROM NEW.subcategoria THEN
    INSERT INTO manual_dados_historico (dado_id, user_id, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, auth.uid(), 'subcategoria', OLD.subcategoria, NEW.subcategoria);
  END IF;

  -- Registrar alteração de unidade
  IF OLD.unidade IS DISTINCT FROM NEW.unidade THEN
    INSERT INTO manual_dados_historico (dado_id, user_id, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, auth.uid(), 'unidade', OLD.unidade, NEW.unidade);
  END IF;

  -- Atualizar timestamp
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_historico_dados_estruturados
  BEFORE UPDATE ON manual_dados_estruturados
  FOR EACH ROW
  EXECUTE FUNCTION registrar_alteracao_dado_estruturado();