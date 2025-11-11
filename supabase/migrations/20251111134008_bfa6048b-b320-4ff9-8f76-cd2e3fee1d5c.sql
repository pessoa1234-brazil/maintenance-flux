-- Tabela de badges/conquistas disponíveis
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  icone TEXT NOT NULL,
  criterio TEXT NOT NULL,
  pontos_necessarios INTEGER,
  cor TEXT NOT NULL DEFAULT '#3B82F6',
  raridade TEXT NOT NULL DEFAULT 'comum',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de badges conquistados pelos prestadores
CREATE TABLE prestador_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  conquistado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(prestador_id, badge_id)
);

-- Tabela de pontos dos prestadores
CREATE TABLE prestador_pontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  pontos_totais INTEGER NOT NULL DEFAULT 0,
  nivel INTEGER NOT NULL DEFAULT 1,
  servicos_completados INTEGER NOT NULL DEFAULT 0,
  avaliacoes_5_estrelas INTEGER NOT NULL DEFAULT 0,
  tempo_resposta_medio_horas NUMERIC,
  taxa_conclusao NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de histórico de pontos
CREATE TABLE historico_pontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pontos INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  os_id UUID REFERENCES ordens_servico(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_prestador_badges_prestador ON prestador_badges(prestador_id);
CREATE INDEX idx_prestador_pontos_ranking ON prestador_pontos(pontos_totais DESC, nivel DESC);
CREATE INDEX idx_historico_pontos_prestador ON historico_pontos(prestador_id, created_at DESC);

-- RLS Policies
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestador_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestador_pontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_pontos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges são públicos"
ON badges FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Prestadores veem seus badges"
ON prestador_badges FOR SELECT
TO authenticated
USING (prestador_id = auth.uid() OR true);

CREATE POLICY "Pontuações são públicas"
ON prestador_pontos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Prestadores veem seu histórico"
ON historico_pontos FOR SELECT
TO authenticated
USING (prestador_id = auth.uid());

CREATE POLICY "Sistema insere badges conquistados"
ON prestador_badges FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Sistema gerencia pontos"
ON prestador_pontos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Sistema registra histórico"
ON historico_pontos FOR INSERT
TO authenticated
WITH CHECK (true);

-- Função para calcular nível baseado em pontos
CREATE OR REPLACE FUNCTION calcular_nivel(pontos INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF pontos < 100 THEN
    RETURN 1;
  ELSIF pontos < 300 THEN
    RETURN 2;
  ELSIF pontos < 600 THEN
    RETURN 3;
  ELSIF pontos < 1000 THEN
    RETURN 4;
  ELSE
    RETURN 5 + ((pontos - 1000) / 500);
  END IF;
END;
$$;

-- Função para verificar e conceder badges
CREATE OR REPLACE FUNCTION verificar_badges(p_prestador_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pontos INTEGER;
  v_servicos INTEGER;
  v_avaliacoes_5 INTEGER;
  v_badge RECORD;
BEGIN
  SELECT pontos_totais, servicos_completados, avaliacoes_5_estrelas
  INTO v_pontos, v_servicos, v_avaliacoes_5
  FROM prestador_pontos
  WHERE prestador_id = p_prestador_id;
  
  FOR v_badge IN 
    SELECT b.id, b.pontos_necessarios
    FROM badges b
    WHERE NOT EXISTS (
      SELECT 1 FROM prestador_badges pb 
      WHERE pb.prestador_id = p_prestador_id 
      AND pb.badge_id = b.id
    )
  LOOP
    IF v_pontos >= v_badge.pontos_necessarios THEN
      INSERT INTO prestador_badges (prestador_id, badge_id)
      VALUES (p_prestador_id, v_badge.id);
    END IF;
  END LOOP;
END;
$$;

-- Função para adicionar pontos
CREATE OR REPLACE FUNCTION adicionar_pontos(
  p_prestador_id UUID,
  p_pontos INTEGER,
  p_motivo TEXT,
  p_os_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_novo_total INTEGER;
BEGIN
  INSERT INTO prestador_pontos (prestador_id, pontos_totais, nivel)
  VALUES (p_prestador_id, p_pontos, calcular_nivel(p_pontos))
  ON CONFLICT (prestador_id) 
  DO UPDATE SET 
    pontos_totais = prestador_pontos.pontos_totais + p_pontos,
    nivel = calcular_nivel(prestador_pontos.pontos_totais + p_pontos),
    updated_at = now()
  RETURNING pontos_totais INTO v_novo_total;
  
  INSERT INTO historico_pontos (prestador_id, pontos, motivo, os_id)
  VALUES (p_prestador_id, p_pontos, p_motivo, p_os_id);
  
  PERFORM verificar_badges(p_prestador_id);
END;
$$;

-- Função trigger para avaliações
CREATE OR REPLACE FUNCTION trigger_pontos_avaliacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pontos INTEGER;
BEGIN
  v_pontos := NEW.nota * 10;
  
  PERFORM adicionar_pontos(
    NEW.prestador_id,
    v_pontos,
    'Avaliação recebida: ' || NEW.nota || ' estrelas',
    NEW.os_id
  );
  
  IF NEW.nota = 5 THEN
    UPDATE prestador_pontos
    SET avaliacoes_5_estrelas = avaliacoes_5_estrelas + 1
    WHERE prestador_id = NEW.prestador_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Função trigger para conclusão de OS
CREATE OR REPLACE FUNCTION trigger_pontos_conclusao_os()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'CONCLUIDA' AND (OLD.status IS NULL OR OLD.status != 'CONCLUIDA') THEN
    PERFORM adicionar_pontos(
      NEW.prestador_id,
      30,
      'Serviço concluído',
      NEW.id
    );
    
    UPDATE prestador_pontos
    SET 
      servicos_completados = servicos_completados + 1,
      tempo_resposta_medio_horas = COALESCE(NEW.tempo_resposta_horas, tempo_resposta_medio_horas)
    WHERE prestador_id = NEW.prestador_id;
    
    IF NEW.tempo_resposta_horas IS NOT NULL AND NEW.tempo_resposta_horas < 2 THEN
      PERFORM adicionar_pontos(
        NEW.prestador_id,
        20,
        'Bônus: Resposta rápida',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar triggers
CREATE TRIGGER pontos_por_avaliacao
AFTER INSERT ON avaliacoes
FOR EACH ROW
EXECUTE FUNCTION trigger_pontos_avaliacao();

CREATE TRIGGER pontos_por_conclusao_os
AFTER UPDATE ON ordens_servico
FOR EACH ROW
EXECUTE FUNCTION trigger_pontos_conclusao_os();