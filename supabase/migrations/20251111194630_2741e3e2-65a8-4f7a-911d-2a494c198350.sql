-- Adicionar política de DELETE para empreendimentos
-- Construtoras podem deletar seus próprios empreendimentos
CREATE POLICY "Construtoras podem deletar seus empreendimentos"
ON public.empreendimentos
FOR DELETE
USING (construtora_id = auth.uid());