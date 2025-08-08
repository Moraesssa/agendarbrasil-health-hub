-- Enable referral -> notification automation via triggers
-- 1) Create triggers to call notify_referral_events on INSERT and UPDATE of encaminhamentos
DROP TRIGGER IF EXISTS trg_notify_referral_insert ON public.encaminhamentos;
CREATE TRIGGER trg_notify_referral_insert
AFTER INSERT ON public.encaminhamentos
FOR EACH ROW
EXECUTE FUNCTION public.notify_referral_events();

DROP TRIGGER IF EXISTS trg_notify_referral_update ON public.encaminhamentos;
CREATE TRIGGER trg_notify_referral_update
AFTER UPDATE ON public.encaminhamentos
FOR EACH ROW
EXECUTE FUNCTION public.notify_referral_events();

-- 2) Performance index for notifications listing and unread counts
CREATE INDEX IF NOT EXISTS idx_family_notifications_user_created
  ON public.family_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_family_notifications_user_read
  ON public.family_notifications (user_id, read);
