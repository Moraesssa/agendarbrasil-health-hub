-- 1. Corrigir INSERT muito permissivo em medico_notifications
DROP POLICY IF EXISTS "Sistema pode criar notificações" ON public.medico_notifications;

CREATE POLICY "Médicos podem criar suas próprias notificações"
  ON public.medico_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = medico_id);

-- 2. Adicionar UPDATE/DELETE policies à tabela legada Consultas (PascalCase)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Consultas'
  ) THEN
    -- Habilitar RLS se ainda não estiver
    EXECUTE 'ALTER TABLE public."Consultas" ENABLE ROW LEVEL SECURITY';

    -- UPDATE: paciente ou médico vinculado
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'Consultas'
        AND policyname = 'Paciente ou medico podem atualizar consulta legada'
    ) THEN
      EXECUTE $POL$
        CREATE POLICY "Paciente ou medico podem atualizar consulta legada"
          ON public."Consultas"
          FOR UPDATE
          TO authenticated
          USING (auth.uid() = paciente_id OR auth.uid() = medico_id)
          WITH CHECK (auth.uid() = paciente_id OR auth.uid() = medico_id)
      $POL$;
    END IF;

    -- DELETE: apenas paciente
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'Consultas'
        AND policyname = 'Paciente pode deletar consulta legada'
    ) THEN
      EXECUTE $POL$
        CREATE POLICY "Paciente pode deletar consulta legada"
          ON public."Consultas"
          FOR DELETE
          TO authenticated
          USING (auth.uid() = paciente_id)
      $POL$;
    END IF;
  END IF;
END $$;