-- Remove ALL public access policies from profiles table
-- This fixes the critical security vulnerability

-- Drop all problematic public policies
DROP POLICY IF EXISTS "Anonymous can view active doctor profiles for scheduling" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;
DROP POLICY IF EXISTS "secure_authenticated_profiles_view" ON public.profiles;
DROP POLICY IF EXISTS "secure_doctor_profiles_for_scheduling" ON public.profiles;

-- Keep only secure user-specific policies
-- (Users can view their own profile, Users can update their own profile, Users can insert their own profile are already secure)

-- Verify no public access remains by checking if RLS is enabled
-- (RLS should already be enabled, but let's make sure)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Now the profiles table only allows:
-- 1. Users to view/update/insert their own profile data
-- 2. No public or anonymous access to doctor emails, names, or photos
-- 3. Doctor discovery must use the secure get_doctors_for_scheduling() function

-- Add final comment for documentation
COMMENT ON TABLE public.profiles 
IS 'Personal user profiles - access restricted to profile owners only. Use get_doctors_for_scheduling() function for safe doctor discovery.';