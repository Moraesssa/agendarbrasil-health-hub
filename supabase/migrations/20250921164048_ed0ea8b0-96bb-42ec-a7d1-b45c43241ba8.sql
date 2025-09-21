-- CORREÇÃO CRÍTICA RLS - ATIVAR EM TODAS AS TABELAS PÚBLICAS
-- Resposta aos 34 problemas de segurança identificados

-- Habilitar RLS em todas as tabelas que não possuem
ALTER TABLE public.Consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Pacientes ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.Usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encaminhamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialidades_medicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_doses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_renewals ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas onde necessário para não quebrar o sistema
CREATE POLICY "especialidades_public_read" ON public.especialidades_medicas
  FOR SELECT TO public
  USING (ativa = true);

CREATE POLICY "medical_services_public_read" ON public.medical_services  
  FOR SELECT TO public
  USING (is_active = true);

-- Comentários
COMMENT ON POLICY "especialidades_public_read" ON public.especialidades_medicas IS 'Permite leitura pública de especialidades ativas';
COMMENT ON POLICY "medical_services_public_read" ON public.medical_services IS 'Permite leitura pública de serviços médicos ativos';