-- Reset database for production - Clear all test data
TRUNCATE TABLE public.consultas RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.pagamentos RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.family_notifications RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.family_members RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.medication_reminders RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.medication_doses RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.health_metrics RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.patient_documents RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.medical_certificates RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.medical_prescriptions RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.medical_exams RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.medical_triage RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.encaminhamentos RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.fhir_resources RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.integration_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.client_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.debug_allowlist RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.document_validations RESTART IDENTITY CASCADE;

-- Clear user data tables but preserve structure
TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.medicos RESTART IDENTITY CASCADE;  
TRUNCATE TABLE public.pacientes RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.locais_atendimento RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.notification_settings RESTART IDENTITY CASCADE;

-- Keep reference data tables (especialidades_medicas, medical_services, external_data_sources)
-- These contain catalog data that should be preserved

-- Note: Auth users will need to be deleted manually from Supabase dashboard
-- or via auth.delete_user() function calls