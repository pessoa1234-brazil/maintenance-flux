-- Add sistema_predial to ativos table to link with NBR 17170 warranty system
ALTER TABLE ativos ADD COLUMN sistema_predial TEXT;

-- Add foreign key comment for documentation
COMMENT ON COLUMN ativos.sistema_predial IS 'Links asset to NBR 17170 warranty system for automatic warranty calculation';

-- Create index for better query performance
CREATE INDEX idx_ativos_sistema_predial ON ativos(sistema_predial);