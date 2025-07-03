
-- Create medication_reminders table
CREATE TABLE public.medication_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'daily', 'twice_daily', 'three_times_daily', 'weekly', 'custom'
  times JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of time strings like ["08:00", "20:00"]
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication_doses table to track individual doses
CREATE TABLE public.medication_doses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_id UUID REFERENCES public.medication_reminders(id) ON DELETE CASCADE NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'taken', 'missed', 'skipped'
  taken_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for medication_reminders
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medication reminders" 
  ON public.medication_reminders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medication reminders" 
  ON public.medication_reminders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication reminders" 
  ON public.medication_reminders 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication reminders" 
  ON public.medication_reminders 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS policies for medication_doses
ALTER TABLE public.medication_doses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medication doses" 
  ON public.medication_doses 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.medication_reminders mr 
    WHERE mr.id = medication_doses.reminder_id 
    AND mr.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own medication doses" 
  ON public.medication_doses 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.medication_reminders mr 
    WHERE mr.id = medication_doses.reminder_id 
    AND mr.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own medication doses" 
  ON public.medication_doses 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.medication_reminders mr 
    WHERE mr.id = medication_doses.reminder_id 
    AND mr.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own medication doses" 
  ON public.medication_doses 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.medication_reminders mr 
    WHERE mr.id = medication_doses.reminder_id 
    AND mr.user_id = auth.uid()
  ));

-- Add updated_at trigger for medication_reminders
CREATE TRIGGER update_medication_reminders_updated_at
  BEFORE UPDATE ON public.medication_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for medication_doses
CREATE TRIGGER update_medication_doses_updated_at
  BEFORE UPDATE ON public.medication_doses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_medication_reminders_user_id ON public.medication_reminders(user_id);
CREATE INDEX idx_medication_doses_reminder_id ON public.medication_doses(reminder_id);
CREATE INDEX idx_medication_doses_scheduled_date ON public.medication_doses(scheduled_date);
