CREATE OR REPLACE FUNCTION public.increment_study_minutes(p_user_id uuid, p_minutes integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET total_study_minutes = total_study_minutes + p_minutes
  WHERE id = p_user_id;
END;
$$;