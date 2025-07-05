ALTER TABLE public.notification_settings
ADD COLUMN user_id UUID;

ALTER TABLE public.notification_settings
ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id)
REFERENCES auth.users(id);