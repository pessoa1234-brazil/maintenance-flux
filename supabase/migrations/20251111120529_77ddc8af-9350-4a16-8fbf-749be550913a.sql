-- Criar política para permitir que usuários criem sua própria role durante signup
CREATE POLICY "Usuários podem criar sua própria role durante signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);