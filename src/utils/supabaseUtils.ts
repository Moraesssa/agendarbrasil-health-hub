/**
 * Utility functions for Supabase client creation and common operations
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Creates a Supabase client with standard configuration
 */
export function createSupabaseClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Creates a Supabase client with service role key for admin operations
 */
export function createSupabaseServiceClient(serviceKey: string) {
  return createClient<Database>(SUPABASE_URL, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Validates environment variables for Supabase connection
 */
export function validateSupabaseEnv(): { url: string; key: string } {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
  
  return { url, key };
}