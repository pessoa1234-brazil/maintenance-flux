-- Corrigir search_path da função calcular_estatisticas_os
DROP FUNCTION IF EXISTS public.calcular_estatisticas_os() CASCADE;

CREATE OR REPLACE FUNCTION public.calcular_estatisticas_os()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calcular tempo de resposta (quando prestador é atribuído)
  IF NEW.prestador_id IS NOT NULL AND (OLD IS NULL OR OLD.prestador_id IS NULL) THEN
    NEW.tempo_resposta_horas := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 3600;
  END IF;
  
  -- Calcular tempo de conclusão
  IF NEW.status = 'CONCLUIDA' AND NEW.data_conclusao IS NOT NULL THEN
    NEW.tempo_conclusao_dias := EXTRACT(EPOCH FROM (NEW.data_conclusao - NEW.data_solicitacao)) / 86400;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER trigger_calcular_estatisticas_os
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.calcular_estatisticas_os();
