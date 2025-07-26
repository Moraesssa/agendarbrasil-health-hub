
-- Criar foreign keys entre consultas e profiles
ALTER TABLE public.consultas 
ADD CONSTRAINT consultas_medico_id_fkey 
FOREIGN KEY (medico_id) REFERENCES public.profiles(id);

ALTER TABLE public.consultas 
ADD CONSTRAINT consultas_paciente_id_fkey 
FOREIGN KEY (paciente_id) REFERENCES public.profiles(id);
