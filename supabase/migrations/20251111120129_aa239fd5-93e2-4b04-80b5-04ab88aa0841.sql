-- Adicionar novos tipos de role ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'cliente';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'prestador';