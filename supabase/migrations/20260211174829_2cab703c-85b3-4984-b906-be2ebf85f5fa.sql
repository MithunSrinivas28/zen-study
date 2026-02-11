
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  total_hours INTEGER NOT NULL DEFAULT 0,
  last_increment TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (public leaderboard)
CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Server-side increment function (enforces 60-min cooldown)
CREATE OR REPLACE FUNCTION public.increment_study_hour(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_last_increment TIMESTAMP WITH TIME ZONE;
  v_diff INTERVAL;
  v_remaining INTEGER;
BEGIN
  -- Verify the caller is the user
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

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
