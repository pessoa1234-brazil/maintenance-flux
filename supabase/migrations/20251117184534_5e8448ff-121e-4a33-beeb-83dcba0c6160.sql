-- Adicionar política para permitir que construtoras e condomínios excluam ativos
CREATE POLICY "Construtoras e condomínios podem excluir ativos"
ON public.ativos
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'construtora') OR 
  has_role(auth.uid(), 'condominio') OR 
  has_role(auth.uid(), 'admin')
);

-- Adicionar política para permitir que construtoras e condomínios atualizem ativos
CREATE POLICY "Construtoras e condomínios podem atualizar ativos"
ON public.ativos
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'construtora') OR 
  has_role(auth.uid(), 'condominio') OR 
  has_role(auth.uid(), 'admin')
)
WITH CHECK (
  has_role(auth.uid(), 'construtora') OR 
  has_role(auth.uid(), 'condominio') OR 
  has_role(auth.uid(), 'admin')
);