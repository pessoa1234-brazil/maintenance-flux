-- Tornar bucket 'manuais' público para permitir acesso via URL
UPDATE storage.buckets 
SET public = true 
WHERE id = 'manuais';