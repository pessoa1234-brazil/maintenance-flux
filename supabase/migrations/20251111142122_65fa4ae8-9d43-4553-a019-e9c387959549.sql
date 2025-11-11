-- Security fix: Add RLS policies for empreendimentos storage bucket
-- Note: Bucket must be manually set to private in Cloud settings

-- Policy: Construtoras can view their own project files
CREATE POLICY "Construtoras can view own project files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'empreendimentos' 
  AND EXISTS (
    SELECT 1 FROM public.empreendimentos e
    WHERE e.id::text = (storage.foldername(name))[1]
    AND e.construtora_id = auth.uid()
  )
);

-- Policy: Construtoras can upload to their own projects
CREATE POLICY "Construtoras can upload to own projects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'empreendimentos'
  AND EXISTS (
    SELECT 1 FROM public.empreendimentos e
    WHERE e.id::text = (storage.foldername(name))[1]
    AND e.construtora_id = auth.uid()
  )
);

-- Policy: Users linked to empreendimento can view files
CREATE POLICY "Linked users can view project files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'empreendimentos'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.empreendimento_id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Service providers with active OS can view files
CREATE POLICY "Service providers can view assigned project files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'empreendimentos'
  AND EXISTS (
    SELECT 1 FROM public.ordens_servico os
    JOIN public.unidades u ON u.id = os.unidade_id
    WHERE os.prestador_id = auth.uid()
    AND u.empreendimento_id::text = (storage.foldername(name))[1]
  )
);