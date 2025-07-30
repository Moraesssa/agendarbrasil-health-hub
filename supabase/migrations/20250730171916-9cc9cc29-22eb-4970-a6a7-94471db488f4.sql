-- Função RPC para buscar horários disponíveis (contorna problemas de RLS)
CREATE OR REPLACE FUNCTION public.get_doctor_schedule_data(p_doctor_id UUID)
RETURNS TABLE(
  doctor_config JSONB,
  locations JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Buscar configurações do médico e locais em uma única query
  RETURN QUERY
  SELECT 
    m.configuracoes as doctor_config,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', la.id,
          'nome_local', la.nome_local,
          'endereco', la.endereco,
          'ativo', la.ativo,
          'telefone', la.telefone
        )
      ) FILTER (WHERE la.id IS NOT NULL),
      '[]'::jsonb
    ) as locations
  FROM public.medicos m
  LEFT JOIN public.locais_atendimento la ON m.user_id = la.medico_id AND la.ativo = true
  WHERE m.user_id = p_doctor_id
  GROUP BY m.user_id, m.configuracoes;
  
  -- Se não encontrou dados, retornar erro
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Médico não encontrado ou sem configurações: %', p_doctor_id;
  END IF;
END;
$$;

-- Comentário para documentação
COMMENT ON FUNCTION public.get_doctor_schedule_data(UUID) 
IS 'Busca configurações de horário e locais de um médico para agendamento, contornando problemas de RLS';

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_doctor_schedule_data(UUID) TO authenticated;