-- Permitir que todos usuários autenticados vejam empreendimentos para vinculação
-- Isso resolve o problema circular onde usuários não conseguiam ver empreendimentos para se vincular

DROP POLICY IF EXISTS "Todos usuários autenticados podem visualizar empreendimentos" ON empreendimentos;

CREATE POLICY "Todos usuários autenticados podem visualizar empreendimentos"
ON empreendimentos
FOR SELECT
TO authenticated
USING (true);

-- Manter as outras políticas existentes para criação e atualização
-- Construtoras continuam sendo as únicas que podem criar/atualizar seus empreendimentos