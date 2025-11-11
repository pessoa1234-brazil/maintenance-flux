-- Corrigir search_path das funções handle_new_user e has_role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_nota_prestador()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET 
    nota_media = (
      SELECT COALESCE(AVG(nota), 0)
      FROM avaliacoes
      WHERE prestador_id = NEW.prestador_id
    ),
    total_avaliacoes = (
      SELECT COUNT(*)
      FROM avaliacoes
      WHERE prestador_id = NEW.prestador_id
    )
  WHERE id = NEW.prestador_id;
  
  RETURN NEW;
END;
$$;