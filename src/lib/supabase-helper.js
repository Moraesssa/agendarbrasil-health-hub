/**
 * Supabase Client Helper
 * Centralized utility for creating Supabase clients with different configurations
 */

const { createClient } = require('@supabase/supabase-js');

// Environment variables with fallbacks
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ulebotjrsgheybhpdnxd.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MzkyNSwiZXhwIjoyMDY2MTE5OTI1fQ.SL5dtN5mpITgn5H0mxAJj9AzQ5bB_Fben2av__A1SMU';

/**
 * Create Supabase client with anonymous key (public access)
 */
function createAnonClient() {
    if (!SUPABASE_ANON_KEY) {
        throw new Error('SUPABASE_ANON_KEY is required');
    }
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Create Supabase client with service role key (admin access)
 */
function createServiceClient() {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

/**
 * Create Supabase client with custom configuration
 */
function createCustomClient(url, key, options = {}) {
    return createClient(url, key, options);
}

/**
 * Get environment configuration
 */
function getSupabaseConfig() {
    return {
        url: SUPABASE_URL,
        anonKey: SUPABASE_ANON_KEY,
        serviceKey: SUPABASE_SERVICE_KEY
    };
}

module.exports = {
    createAnonClient,
    createServiceClient,
    createCustomClient,
    getSupabaseConfig,
    // Legacy exports for backward compatibility
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY
};