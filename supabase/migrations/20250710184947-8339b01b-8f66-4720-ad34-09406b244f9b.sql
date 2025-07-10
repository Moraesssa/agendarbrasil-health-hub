-- Create table for medical prescriptions
CREATE TABLE public.medical_prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER,
  instructions TEXT,
  prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for prescription renewals
CREATE TABLE public.prescription_renewals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.medical_prescriptions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_duration_days INTEGER,
  doctor_notes TEXT,
  patient_notes TEXT,
  processed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_renewals ENABLE ROW LEVEL SECURITY;

-- RLS policies for medical_prescriptions
CREATE POLICY "Patients can view their own prescriptions" 
ON public.medical_prescriptions 
FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view prescriptions they created" 
ON public.medical_prescriptions 
FOR SELECT 
USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can create prescriptions" 
ON public.medical_prescriptions 
FOR INSERT 
WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their prescriptions" 
ON public.medical_prescriptions 
FOR UPDATE 
USING (auth.uid() = doctor_id);

-- RLS policies for prescription_renewals
CREATE POLICY "Patients can view their own renewal requests" 
ON public.prescription_renewals 
FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view renewal requests for their prescriptions" 
ON public.prescription_renewals 
FOR SELECT 
USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can create renewal requests" 
ON public.prescription_renewals 
FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctors can update renewal requests" 
ON public.prescription_renewals 
FOR UPDATE 
USING (auth.uid() = doctor_id);

-- Add triggers for updated_at
CREATE TRIGGER update_medical_prescriptions_updated_at
BEFORE UPDATE ON public.medical_prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescription_renewals_updated_at
BEFORE UPDATE ON public.prescription_renewals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();