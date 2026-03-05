
-- Fix the broken RLS policy on focus_sessions SELECT
-- The existing policy has a bug: focus_participants.session_id = focus_participants.id (should reference focus_sessions.id)
DROP POLICY IF EXISTS "Participants can view sessions" ON public.focus_sessions;
CREATE POLICY "Participants can view sessions"
ON public.focus_sessions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.focus_participants
    WHERE focus_participants.session_id = focus_sessions.id
      AND focus_participants.user_id = auth.uid()
  )
  OR created_by = auth.uid()
);

-- Allow any participant to update the session (needed for completing sessions)
DROP POLICY IF EXISTS "Creator can update sessions" ON public.focus_sessions;
CREATE POLICY "Participants can update sessions"
ON public.focus_sessions FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.focus_participants
    WHERE focus_participants.session_id = focus_sessions.id
      AND focus_participants.user_id = auth.uid()
  )
  OR created_by = auth.uid()
);
