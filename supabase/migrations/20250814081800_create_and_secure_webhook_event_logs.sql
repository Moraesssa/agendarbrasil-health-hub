-- Create the webhook_event_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.webhook_event_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payload JSONB,
  status TEXT,
  error_message TEXT
);

-- Enable Row Level Security
ALTER TABLE public.webhook_event_logs ENABLE ROW LEVEL SECURITY;

-- Remove public access
REVOKE ALL ON TABLE public.webhook_event_logs FROM public;
REVOKE ALL ON TABLE public.webhook_event_logs FROM authenticated;
REVOKE ALL ON TABLE public.webhook_event_logs FROM anon;

-- Grant access to service_role
GRANT ALL ON TABLE public.webhook_event_logs TO service_role;

-- Create a policy to allow service role to access all logs
CREATE POLICY "Allow service role to access all logs"
ON public.webhook_event_logs
FOR ALL
TO service_role
USING (true);

-- Create a policy to allow only 'medico' users (administrators) to view the logs
CREATE POLICY "Allow administrators to view integration logs"
ON public.webhook_event_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'medico'
  )
);

-- Add a comment to the new policy for clarity
COMMENT ON POLICY "Allow administrators to view integration logs" ON public.webhook_event_logs
IS 'Only users with the medico user_type can view webhook event logs.';
