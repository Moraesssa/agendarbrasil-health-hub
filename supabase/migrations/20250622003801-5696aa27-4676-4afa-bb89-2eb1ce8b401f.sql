
-- Atualizar a função para lidar com novos usuários
-- Remove a atribuição automática de user_type para permitir seleção pelo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    photo_url,
    user_type,
    onboarding_completed,
    last_login,
    is_active,
    preferences
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', ''),
    NULL, -- Deixar null para o usuário escolher o tipo
    false,
    NOW(),
    true,
    '{"notifications": true, "theme": "light", "language": "pt-BR"}'::jsonb
  );
  RETURN NEW;
END;
$$;
