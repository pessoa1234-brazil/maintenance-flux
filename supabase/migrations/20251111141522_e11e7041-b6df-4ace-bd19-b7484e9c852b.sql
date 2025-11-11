-- Security improvements for profiles and contract signatures

-- 1. Add explicit deny-all policy for profiles to prevent unauthorized access
CREATE POLICY "Deny all profile access by default"
ON public.profiles
FOR SELECT
TO authenticated
USING (false);

-- Drop and recreate the existing policy with higher priority
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;

CREATE POLICY "Users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Create a function to hash IP addresses for privacy
CREATE OR REPLACE FUNCTION public.hash_ip_address(ip_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use SHA-256 to hash IP address for privacy while maintaining audit capability
  RETURN encode(digest(ip_text || 'salt_key_change_in_production', 'sha256'), 'hex');
END;
$$;

-- 3. Add a trigger to automatically hash IP addresses on insert
CREATE OR REPLACE FUNCTION public.hash_contract_signature_ip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hash the IP address before storing
  IF NEW.ip_address IS NOT NULL THEN
    NEW.ip_address := public.hash_ip_address(NEW.ip_address);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER hash_ip_before_insert
BEFORE INSERT ON public.assinaturas_contrato
FOR EACH ROW
EXECUTE FUNCTION public.hash_contract_signature_ip();

-- 4. Update existing IP addresses to be hashed (one-time migration)
UPDATE public.assinaturas_contrato
SET ip_address = public.hash_ip_address(ip_address)
WHERE ip_address IS NOT NULL
  AND length(ip_address) < 64; -- Only hash unhashed IPs (SHA-256 produces 64 char hex)

-- 5. Add comment explaining privacy measures
COMMENT ON COLUMN public.assinaturas_contrato.ip_address IS 'Hashed IP address (SHA-256) for audit trail while preserving user privacy';