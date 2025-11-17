-- Garantir que a tabela manual_dados_estruturados permite leitura para usuários vinculados
-- Adicionar política RLS para permitir visualização por usuários vinculados ao empreendimento

-- Remover política existente se houver conflito
DROP POLICY IF EXISTS "Usuários vinculados podem ver dados estruturados" ON public.manual_dados_estruturados;

-- Criar política para permitir que usuários vinculados ao empreendimento vejam os dados
CREATE POLICY "Usuários vinculados podem ver dados estruturados"
ON public.manual_dados_estruturados
FOR SELECT
TO authenticated
USING (
  empreendimento_id IN (
    SELECT empreendimento_id 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND empreendimento_id IS NOT NULL
  )
  OR has_role(auth.uid(), 'construtora')
  OR has_role(auth.uid(), 'admin')
);