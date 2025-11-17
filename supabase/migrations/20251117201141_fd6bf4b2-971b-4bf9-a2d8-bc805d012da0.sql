-- Remover a constraint existente de status
ALTER TABLE manuais_conteudo DROP CONSTRAINT IF EXISTS manuais_conteudo_status_check;

-- Adicionar nova constraint que permite os status necessários
ALTER TABLE manuais_conteudo ADD CONSTRAINT manuais_conteudo_status_check 
CHECK (status IN ('processando', 'processado', 'concluido', 'erro'));

-- Atualizar registros existentes de 'concluido' para 'processado'
UPDATE manuais_conteudo 
SET status = 'processado' 
WHERE status = 'concluido';