-- Add unique constraint for upsert operations on manual_dados_estruturados
ALTER TABLE manual_dados_estruturados 
ADD CONSTRAINT manual_dados_estruturados_unique_key 
UNIQUE (empreendimento_id, tipo_manual, categoria, chave);