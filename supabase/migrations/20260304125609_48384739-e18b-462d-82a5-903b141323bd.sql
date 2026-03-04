-- Friends table (bidirectional friendships)
CREATE TABLE public.friendships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Friend requests
CREATE TABLE public.friend_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

-- Focus sessions (shared study rooms)
CREATE TABLE public.focus_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  focus_duration integer NOT NULL DEFAULT 3000,
  break_duration integer NOT NULL DEFAULT 600,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Focus session participants
CREATE TABLE public.focus_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.focus_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'invited',
  joined_at timestamptz,
  left_at timestamptz,
  points_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb DEFAULT '{}',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add battle_points and battle_wins to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS battle_points integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS battle_wins integer NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Friendships policies
CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert own friendships" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own friendships" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend requests policies
CREATE POLICY "Users can view own requests" ON public.friend_requests FOR SELECT TO authenticated USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can send requests" ON public.friend_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can update received requests" ON public.friend_requests FOR UPDATE TO authenticated USING (auth.uid() = to_user_id);

-- Focus sessions policies
CREATE POLICY "Participants can view sessions" ON public.focus_sessions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.focus_participants WHERE session_id = id AND user_id = auth.uid())
  OR created_by = auth.uid()
);
CREATE POLICY "Users can create sessions" ON public.focus_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update sessions" ON public.focus_sessions FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Focus participants policies
CREATE POLICY "Users can view participants" ON public.focus_participants FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.focus_participants fp WHERE fp.session_id = focus_participants.session_id AND fp.user_id = auth.uid())
);
CREATE POLICY "Session creator can invite" ON public.focus_participants FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.focus_sessions WHERE id = session_id AND created_by = auth.uid())
  OR auth.uid() = user_id
);
CREATE POLICY "Users can update own participation" ON public.focus_participants FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for live session sync and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;

-- Helper function to look up username without RLS recursion
CREATE OR REPLACE FUNCTION public.get_username(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT username FROM public.profiles WHERE id = p_user_id;
$$;