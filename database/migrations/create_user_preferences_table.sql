-- Migration: Create user_preferences table
-- Description: Stores user preferences for dashboard customization
-- Date: 2025-11-02

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preference_type VARCHAR(50) NOT NULL, -- 'dashboard', 'notifications', 'theme', etc.
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one preference per user per type
    UNIQUE(user_id, preference_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
    ON public.user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_type 
    ON public.user_preferences(preference_type);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_type 
    ON public.user_preferences(user_id, preference_type);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" 
    ON public.user_preferences 
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" 
    ON public.user_preferences 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" 
    ON public.user_preferences 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;
CREATE POLICY "Users can delete own preferences" 
    ON public.user_preferences 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE public.user_preferences IS 'Stores user preferences for various features (dashboard, notifications, theme, etc.)';
COMMENT ON COLUMN public.user_preferences.preference_type IS 'Type of preference: dashboard, notifications, theme, etc.';
COMMENT ON COLUMN public.user_preferences.preferences IS 'JSONB object containing the actual preference data';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trigger_update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT USAGE ON SEQUENCE user_preferences_id_seq TO authenticated;
