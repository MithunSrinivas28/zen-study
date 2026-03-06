
-- Fix infinite recursion in focus_participants and focus_sessions RLS policies

-- Step 1: Create a security definer function to check participation without triggering RLS
CREATE OR REPLACE FUNCTION public.is_session_participant(_session_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.focus_participants
    WHERE session_id = _session_id AND user_id = _user_id
  );
$$;

-- Step 2: Drop and recreate focus_participants policies
DROP POLICY IF EXISTS "Users can view participants" ON public.focus_participants;
CREATE POLICY "Users can view participants"
  ON public.focus_participants
  FOR SELECT
  TO authenticated
  USING (
    public.is_session_participant(session_id, auth.uid())
  );

DROP POLICY IF EXISTS "Session creator can invite" ON public.focus_participants;
CREATE POLICY "Session creator can invite"
  ON public.focus_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.focus_sessions
      WHERE id = session_id AND created_by = auth.uid()
    )
  );

-- Step 3: Drop and recreate focus_sessions policies that reference focus_participants
DROP POLICY IF EXISTS "Participants can view sessions" ON public.focus_sessions;
CREATE POLICY "Participants can view sessions"
  ON public.focus_sessions
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_session_participant(id, auth.uid())
  );

DROP POLICY IF EXISTS "Participants can update sessions" ON public.focus_sessions;
CREATE POLICY "Participants can update sessions"
  ON public.focus_sessions
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_session_participant(id, auth.uid())
  );
