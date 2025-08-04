-- Corrigir a função RPC get_doctor_schedule_data para resolver erro de relacionamento
DROP FUNCTION IF EXISTS public.get_doctor_schedule_data(uuid);

CREATE OR REPLACE FUNCTION public.get_doctor_schedule_data(p_doctor_id uuid)
RETURNS TABLE(
  doctor_config jsonb,
  locations jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.configuracoes as doctor_config,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', la.id,
          'nome_local', la.nome_local,
          'endereco_completo', COALESCE(la.endereco_completo, la.endereco::text),
          'endereco', la.endereco,
          'bairro', la.bairro,
          'cidade', la.cidade,
          'estado', la.estado,
          'cep', la.cep,
          'telefone', la.telefone,
          'whatsapp', la.whatsapp,
          'email', la.email,
          'website', la.website,
          'coordenadas', la.coordenadas,
          'horario_funcionamento', la.horario_funcionamento,
          'facilidades', la.facilidades,
          'status', la.status,
          'ativo', la.ativo,
          'ultima_atualizacao', la.ultima_atualizacao,
          'is_open_now', CASE 
            WHEN la.status != 'ativo' THEN false
            ELSE true
          END
        )
      ) FILTER (WHERE la.id IS NOT NULL),
      '[]'::jsonb
    ) as locations
  FROM public.medicos m
  LEFT JOIN public.locais_atendimento la ON m.user_id = la.medico_id 
    AND la.ativo = true
    AND la.status IN ('ativo', 'temporariamente_fechado')
  WHERE m.user_id = p_doctor_id
  GROUP BY m.user_id, m.configuracoes;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Médico não encontrado ou sem configurações: %', p_doctor_id;
  END IF;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_doctor_schedule_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_schedule_data(UUID) TO anon;