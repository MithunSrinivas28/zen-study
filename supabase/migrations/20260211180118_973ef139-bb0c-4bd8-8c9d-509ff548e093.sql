
-- Create study_logs table to track each study session
CREATE TABLE public.study_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient querying by user and date
CREATE INDEX idx_study_logs_user_date ON public.study_logs (user_id, logged_at DESC);

-- Enable RLS
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;

-- Logs are publicly readable (for leaderboard streaks)
CREATE POLICY "Study logs are publicly readable"
ON public.study_logs
FOR SELECT
USING (true);

-- Only the system (via SECURITY DEFINER function) inserts logs
-- No direct insert/update/delete for users
CREATE POLICY "No direct insert"
ON public.study_logs
FOR INSERT
WITH CHECK (false);

-- Update increment_study_hour to also insert a study log
CREATE OR REPLACE FUNCTION public.increment_study_hour(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_increment TIMESTAMP WITH TIME ZONE;
  v_diff INTERVAL;
  v_remaining INTEGER;
BEGIN
  IF auth.uid() != p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT last_increment INTO v_last_increment
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_last_increment IS NOT NULL THEN
    v_diff := now() - v_last_increment;
    IF v_diff < INTERVAL '60 minutes' THEN
      v_remaining := EXTRACT(EPOCH FROM (INTERVAL '60 minutes' - v_diff))::INTEGER;
      RETURN json_build_object('success', false, 'error', 'cooldown', 'remaining_seconds', v_remaining);
    END IF;
  END IF;

  UPDATE public.profiles
  SET total_hours = total_hours + 1,
      last_increment = now()
  WHERE id = p_user_id;

  -- Log the study session
  INSERT INTO public.study_logs (user_id, logged_at)
  VALUES (p_user_id, now());

  RETURN json_build_object('success', true);
END;
$$;
