-- Create patient_documents table
CREATE TABLE public.patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for patient_documents
CREATE POLICY "Users can view their own documents" 
ON public.patient_documents 
FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Users can create their own documents" 
ON public.patient_documents 
FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update their own documents" 
ON public.patient_documents 
FOR UPDATE 
USING (auth.uid() = patient_id);

CREATE POLICY "Users can delete their own documents" 
ON public.patient_documents 
FOR DELETE 
USING (auth.uid() = patient_id);

-- Create storage bucket for health documents
INSERT INTO storage.buckets (id, name, public) VALUES ('health-documents', 'health-documents', false);

-- Create storage policies for health documents
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'health-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'health-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'health-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'health-documents' AND auth.uid()::text = (storage.foldername(name))[1]);