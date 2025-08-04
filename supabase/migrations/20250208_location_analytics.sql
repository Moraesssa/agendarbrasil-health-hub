-- Location Analytics Database Schema
-- replaced by kiro @2025-02-08T19:30:00Z

-- Location Analytics Table
CREATE TABLE IF NOT EXISTS location_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id TEXT NOT NULL,
    total_views INTEGER DEFAULT 0,
    total_selections INTEGER DEFAULT 0,
    selection_rate DECIMAL(5,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    popularity_score INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(location_id)
);

-- Location Interactions Table
CREATE TABLE IF NOT EXISTS location_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'select', 'call', 'map', 'share', 'compare')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location Feedback Table
CREATE TABLE IF NOT EXISTS location_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('rating', 'correction', 'suggestion')),
    category TEXT CHECK (category IN ('facilities', 'contact', 'hours', 'accessibility', 'general')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location Corrections Table
CREATE TABLE IF NOT EXISTS location_corrections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    current_value TEXT NOT NULL,
    suggested_value TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_location_analytics_location_id ON location_analytics(location_id);
CREATE INDEX IF NOT EXISTS idx_location_interactions_location_id ON location_interactions(location_id);
CREATE INDEX IF NOT EXISTS idx_location_interactions_user_id ON location_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_location_interactions_timestamp ON location_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_location_interactions_type ON location_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_location_feedback_location_id ON location_feedback(location_id);
CREATE INDEX IF NOT EXISTS idx_location_feedback_user_id ON location_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_location_feedback_verified ON location_feedback(is_verified);
CREATE INDEX IF NOT EXISTS idx_location_corrections_location_id ON location_corrections(location_id);
CREATE INDEX IF NOT EXISTS idx_location_corrections_status ON location_corrections(status);

-- RLS Policies
ALTER TABLE location_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_corrections ENABLE ROW LEVEL SECURITY;

-- Analytics policies (read-only for authenticated users)
CREATE POLICY "Analytics readable by authenticated users" ON location_analytics
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Analytics writable by service role" ON location_analytics
    FOR ALL TO service_role USING (true);

-- Interactions policies
CREATE POLICY "Users can insert their own interactions" ON location_interactions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own interactions" ON location_interactions
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can manage all interactions" ON location_interactions
    FOR ALL TO service_role USING (true);

-- Feedback policies
CREATE POLICY "Users can insert their own feedback" ON location_feedback
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON location_feedback
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Verified feedback readable by all authenticated users" ON location_feedback
    FOR SELECT TO authenticated USING (is_verified = true);

CREATE POLICY "Users can view their own feedback" ON location_feedback
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all feedback" ON location_feedback
    FOR ALL TO service_role USING (true);

-- Corrections policies
CREATE POLICY "Users can insert their own corrections" ON location_corrections
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own corrections" ON location_corrections
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all corrections" ON location_corrections
    FOR ALL TO service_role USING (true);

-- Functions for analytics updates
CREATE OR REPLACE FUNCTION increment_location_views(location_id TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO location_analytics (location_id, total_views, last_updated)
    VALUES (location_id, 1, NOW())
    ON CONFLICT (location_id)
    DO UPDATE SET
        total_views = location_analytics.total_views + 1,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_location_selections(location_id TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO location_analytics (location_id, total_selections, last_updated)
    VALUES (location_id, 1, NOW())
    ON CONFLICT (location_id)
    DO UPDATE SET
        total_selections = location_analytics.total_selections + 1,
        selection_rate = CASE 
            WHEN location_analytics.total_views > 0 
            THEN ROUND((location_analytics.total_selections + 1.0) / location_analytics.total_views * 100, 2)
            ELSE 0
        END,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_location_rating(location_id TEXT, new_rating INTEGER)
RETURNS void AS $$
DECLARE
    current_avg DECIMAL(3,2);
    current_count INTEGER;
    new_avg DECIMAL(3,2);
BEGIN
    -- Get current rating data
    SELECT average_rating, total_ratings 
    INTO current_avg, current_count
    FROM location_analytics 
    WHERE location_analytics.location_id = update_location_rating.location_id;
    
    -- If no record exists, create one
    IF current_count IS NULL THEN
        current_avg := 0;
        current_count := 0;
    END IF;
    
    -- Calculate new average
    new_avg := ROUND((current_avg * current_count + new_rating) / (current_count + 1.0), 2);
    
    -- Update analytics
    INSERT INTO location_analytics (location_id, average_rating, total_ratings, last_updated)
    VALUES (location_id, new_avg, 1, NOW())
    ON CONFLICT (location_id)
    DO UPDATE SET
        average_rating = new_avg,
        total_ratings = location_analytics.total_ratings + 1,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_location_rating_summary(location_id TEXT)
RETURNS TABLE(average_rating DECIMAL(3,2), total_ratings INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(la.average_rating, 0) as average_rating,
        COALESCE(la.total_ratings, 0) as total_ratings
    FROM location_analytics la
    WHERE la.location_id = get_location_rating_summary.location_id;
    
    -- If no record found, return defaults
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0::DECIMAL(3,2), 0::INTEGER;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_location_popularity_indicators(location_ids TEXT[])
RETURNS TABLE(
    location_id TEXT,
    popularity_score INTEGER,
    trend_direction TEXT,
    recent_selections INTEGER,
    comparison_to_average DECIMAL(5,2)
) AS $$
DECLARE
    avg_selections DECIMAL;
BEGIN
    -- Calculate average selections across all locations
    SELECT AVG(total_selections) INTO avg_selections
    FROM location_analytics
    WHERE location_analytics.location_id = ANY(location_ids);
    
    IF avg_selections IS NULL THEN
        avg_selections := 0;
    END IF;
    
    RETURN QUERY
    SELECT 
        la.location_id,
        COALESCE(la.popularity_score, 0) as popularity_score,
        CASE 
            WHEN recent_interactions.recent_count > recent_interactions.prev_count THEN 'crescendo'
            WHEN recent_interactions.recent_count < recent_interactions.prev_count THEN 'decrescendo'
            ELSE 'estável'
        END as trend_direction,
        COALESCE(recent_interactions.recent_count, 0) as recent_selections,
        CASE 
            WHEN avg_selections > 0 THEN ROUND((la.total_selections - avg_selections) / avg_selections * 100, 2)
            ELSE 0
        END as comparison_to_average
    FROM location_analytics la
    LEFT JOIN (
        SELECT 
            li.location_id,
            COUNT(CASE WHEN li.timestamp >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_count,
            COUNT(CASE WHEN li.timestamp >= NOW() - INTERVAL '14 days' AND li.timestamp < NOW() - INTERVAL '7 days' THEN 1 END) as prev_count
        FROM location_interactions li
        WHERE li.interaction_type = 'select'
        GROUP BY li.location_id
    ) recent_interactions ON la.location_id = recent_interactions.location_id
    WHERE la.location_id = ANY(location_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update analytics when feedback is inserted
CREATE OR REPLACE FUNCTION update_analytics_on_feedback()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rating IS NOT NULL THEN
        PERFORM update_location_rating(NEW.location_id, NEW.rating);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_analytics_on_feedback
    AFTER INSERT ON location_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_on_feedback();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON location_analytics TO authenticated;
GRANT INSERT, SELECT ON location_interactions TO authenticated;
GRANT INSERT, SELECT, UPDATE ON location_feedback TO authenticated;
GRANT INSERT, SELECT ON location_corrections TO authenticated;

GRANT ALL ON location_analytics TO service_role;
GRANT ALL ON location_interactions TO service_role;
GRANT ALL ON location_feedback TO service_role;
GRANT ALL ON location_corrections TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_location_views(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_location_selections(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_location_rating(TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_location_rating_summary(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_location_popularity_indicators(TEXT[]) TO authenticated, service_role;