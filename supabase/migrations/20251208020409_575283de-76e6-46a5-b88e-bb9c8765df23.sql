-- ============================================================
-- CORREÇÃO CRÍTICA: Habilitar RLS na tabela profiles
-- ============================================================

-- 1. HABILITAR RLS NA TABELA PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES PARA profiles
-- ============================================================

-- Policy: Usuários podem ver seus próprios dados
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Usuários podem atualizar seus próprios dados
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Permitir insert durante criação de conta (trigger handle_new_user)
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Médicos ativos são visíveis para agendamento
CREATE POLICY "profiles_doctors_public"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.medicos m
    WHERE m.user_id = profiles.id AND m.is_active = true
  )
);

-- Policy: Service role pode fazer tudo (triggers e funções administrativas)
CREATE POLICY "profiles_service_role_all"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. MARCAR TABELAS DUPLICADAS COMO DEPRECATED
-- ============================================================
COMMENT ON TABLE public."Consultas" IS 'DEPRECATED: Use public.consultas instead. Esta tabela será removida em versão futura.';
COMMENT ON TABLE public."Medicos" IS 'DEPRECATED: Use public.medicos instead. Esta tabela será removida em versão futura.';
COMMENT ON TABLE public."Pacientes" IS 'DEPRECATED: Use public.pacientes instead. Esta tabela será removida em versão futura.';
COMMENT ON TABLE public."Usuarios" IS 'DEPRECATED: Use public.profiles instead. Esta tabela será removida em versão futura.';

-- 4. VERIFICAÇÃO FINAL
DO $$
DECLARE
  v_profiles_rls BOOLEAN;
  v_profiles_policies INTEGER;
BEGIN
  SELECT relrowsecurity INTO v_profiles_rls
  FROM pg_class WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace;
  
  SELECT COUNT(*) INTO v_profiles_policies
  FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public';
  
  RAISE NOTICE 'RLS habilitado em profiles: %', v_profiles_rls;
  RAISE NOTICE 'Policies em profiles: %', v_profiles_policies;
END $$;