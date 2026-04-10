-- Add hotkey column to user_dashboards
ALTER TABLE public.user_dashboards ADD COLUMN hotkey integer NULL;

-- Hotkey must be between 1 and 9
ALTER TABLE public.user_dashboards ADD CONSTRAINT check_hotkey_range CHECK (hotkey >= 1 AND hotkey <= 9);

-- Unique hotkey per user
CREATE UNIQUE INDEX idx_user_dashboards_user_id_hotkey ON public.user_dashboards(user_id, hotkey);
