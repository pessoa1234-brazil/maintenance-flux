-- Criar bucket de storage para imagens do manual do proprietário
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'manual-proprietario-imagens',
  'manual-proprietario-imagens',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
);

-- Políticas de storage para imagens do manual
CREATE POLICY "Construtoras podem fazer upload de imagens"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'manual-proprietario-imagens' AND
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'construtora'
  )
);

CREATE POLICY "Imagens do manual são públicas"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'manual-proprietario-imagens');

CREATE POLICY "Construtoras podem deletar imagens"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'manual-proprietario-imagens' AND
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'construtora'
  )
);

-- Adicionar campo para armazenar URLs de imagens nas seções
ALTER TABLE manual_proprietario_conteudo
ADD COLUMN IF NOT EXISTS imagens jsonb DEFAULT '[]'::jsonb;