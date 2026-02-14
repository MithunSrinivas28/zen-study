
-- Add points column to profiles
ALTER TABLE public.profiles ADD COLUMN points integer NOT NULL DEFAULT 0;

-- Create daily_commitments table
CREATE TABLE public.daily_commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  commitment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_hours INTEGER NOT NULL CHECK (target_hours >= 1 AND target_hours <= 12),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, commitment_date)
);

ALTER TABLE public.daily_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commitments"
  ON public.daily_commitments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commitment"
  ON public.daily_commitments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commitment"
  ON public.daily_commitments FOR UPDATE
  USING (auth.uid() = user_id);

-- Update increment_study_hour to award points and check commitment completion
CREATE OR REPLACE FUNCTION public.increment_study_hour(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_last_increment TIMESTAMP WITH TIME ZONE;
  v_diff INTERVAL;
  v_remaining INTEGER;
  v_bonus INTEGER := 0;
  v_today_hours INTEGER;
  v_target INTEGER;
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

  -- Update hours and base points (+10)
  UPDATE public.profiles
  SET total_hours = total_hours + 1,
      last_increment = now(),
      points = points + 10
  WHERE id = p_user_id;

  -- Log the study session
  INSERT INTO public.study_logs (user_id, logged_at)
  VALUES (p_user_id, now());

  -- Check if daily commitment is now completed for bonus
  SELECT COUNT(*) INTO v_today_hours
  FROM public.study_logs
  WHERE user_id = p_user_id
    AND logged_at::date = CURRENT_DATE;

  SELECT target_hours INTO v_target
  FROM public.daily_commitments
  WHERE user_id = p_user_id
    AND commitment_date = CURRENT_DATE;

  IF v_target IS NOT NULL AND v_today_hours = v_target THEN
    -- Exactly hit target = award bonus (only once)
    UPDATE public.profiles
    SET points = points + 20
    WHERE id = p_user_id;
    v_bonus := 20;
  END IF;

  RETURN json_build_object('success', true, 'points_earned', 10 + v_bonus);
END;
$function$;
