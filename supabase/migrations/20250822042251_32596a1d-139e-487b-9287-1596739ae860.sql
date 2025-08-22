-- Add SELECT policy for debug_allowlist table
CREATE POLICY "Users can view their own allowlist entry" 
ON public.debug_allowlist 
FOR SELECT 
USING (auth.uid() = user_id);