-- Drop the old, incorrect policies
DROP POLICY IF EXISTS "Patients can view their own health metrics" ON public.health_metrics;
DROP POLICY IF EXISTS "Authenticated users can insert health metrics" ON public.health_metrics;
DROP POLICY IF EXISTS "Patients can view their own metrics" ON public.health_metrics;
DROP POLICY IF EXISTS "Patients can insert their own metrics" ON public.health_metrics;

-- Create a new, correct SELECT policy
-- Allows a user to see metrics if the patient_id matches their own patient profile ID.
CREATE POLICY "Allow patients to view their own metrics"
ON public.health_metrics
FOR SELECT
USING (
  (EXISTS ( SELECT 1
     FROM pacientes
    WHERE ((pacientes.user_id = auth.uid()) AND (pacientes.id = health_metrics.patient_id))))
);

-- Create a new, correct INSERT policy
-- Allows a user to insert metrics if the patient_id matches their own patient profile ID.
CREATE POLICY "Allow patients to insert their own metrics"
ON public.health_metrics
FOR INSERT
WITH CHECK (
  (EXISTS ( SELECT 1
     FROM pacientes
    WHERE ((pacientes.user_id = auth.uid()) AND (pacientes.id = health_metrics.patient_id))))
);