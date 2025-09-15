-- Sync auth.users entries to public.usuarios table
-- Ensures that newly created auth users automatically receive a corresponding
-- record in the application usuarios table.

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_usuarios()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, tipo, telefone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'paciente'),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_to_usuarios();
