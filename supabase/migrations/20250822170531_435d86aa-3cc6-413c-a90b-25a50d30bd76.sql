-- Clean up duplicate allowlist entries, keeping only the most recent active one per user
WITH ranked_entries AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY granted_at DESC) as rn
  FROM public.debug_allowlist
  WHERE is_active = true
)
UPDATE public.debug_allowlist 
SET is_active = false 
WHERE id IN (
  SELECT id 
  FROM ranked_entries 
  WHERE rn > 1
);