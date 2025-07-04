-- Migration to create the health_metrics table and its policies.

-- 1. Create the health_metrics table
CREATE TABLE public.health_metrics (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL,
    appointment_id uuid NULL,
    metric_type text NOT NULL,
    value jsonb NOT NULL,
    unit text NOT NULL,
    recorded_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT health_metrics_pkey PRIMARY KEY (id),
    CONSTRAINT health_metrics_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.pacientes(id) ON DELETE CASCADE,
    CONSTRAINT health_metrics_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.consultas(id) ON DELETE SET NULL
);

-- 2. Add comments to describe the table and its columns for future reference
COMMENT ON TABLE public.health_metrics IS 'Stores quantitative health metrics for patients over time.';
COMMENT ON COLUMN public.health_metrics.metric_type IS 'Type of the metric (e.g., ''blood_pressure'', ''weight'', ''blood_glucose'').';
COMMENT ON COLUMN public.health_metrics.value IS 'The actual value(s) of the metric, stored in JSONB format (e.g., { "systolic": 120, "diastolic": 80 }).';
COMMENT ON COLUMN public.health_metrics.recorded_at IS 'Timestamp of when the metric was measured.';


-- 3. Enable Row-Level Security (RLS) on the new table
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Policy: Patients can view their own health metrics.
CREATE POLICY "Patients can view their own health metrics"
ON public.health_metrics
FOR SELECT
USING (auth.uid() = patient_id);

-- Policy: Authenticated users can insert new metrics for any patient.
-- Note: This could be restricted further later if needed (e.g., only for their own patients).
CREATE POLICY "Authenticated users can insert health metrics"
ON public.health_metrics
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');