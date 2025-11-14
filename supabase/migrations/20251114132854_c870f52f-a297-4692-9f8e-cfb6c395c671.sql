-- Permitir que admins também possam criar empreendimentos
CREATE POLICY "Admins podem criar empreendimentos"
ON empreendimentos
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Permitir que admins possam atualizar qualquer empreendimento
CREATE POLICY "Admins podem atualizar empreendimentos"
ON empreendimentos
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Permitir que admins possam deletar qualquer empreendimento
CREATE POLICY "Admins podem deletar empreendimentos"
ON empreendimentos
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));