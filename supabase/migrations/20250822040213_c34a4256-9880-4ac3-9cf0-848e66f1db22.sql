-- Enable RLS and add missing policies for debug_allowlist
ALTER TABLE public.debug_allowlist ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own allowlist entry
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'debug_allowlist' 
      AND policyname = 'Users can insert their own allowlist entry'
  ) THEN
    CREATE POLICY "Users can insert their own allowlist entry"
      ON public.debug_allowlist
      FOR INSERT
      TO public
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Allow users to update their own allowlist entry (e.g., disable is_active)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'debug_allowlist' 
      AND policyname = 'Users can update their own allowlist entry'
  ) THEN
    CREATE POLICY "Users can update their own allowlist entry"
      ON public.debug_allowlist
      FOR UPDATE
      TO public
      USING (auth.uid() = user_id);
  END IF;
END$$;