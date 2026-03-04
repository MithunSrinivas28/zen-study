import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FocusSession {
  id: string;
  created_by: string;
  status: string;
  focus_duration: number;
  break_duration: number;
  started_at: string | null;
  ended_at: string | null;
}

export interface FocusParticipant {
  id: string;
  session_id: string;
  user_id: string;
  username?: string;
  status: string;
  joined_at: string | null;
  left_at: string | null;
  points_earned: number;
}

export function useFocusSession() {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [participants, setParticipants] = useState<FocusParticipant[]>([]);
  const [pendingInvites, setPendingInvites] = useState<(FocusParticipant & { session?: FocusSession; creator_username?: string })[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchActiveSession = useCallback(async () => {
    if (!user) return;
    // Find a session where I'm an active participant
    const { data: myParts } = await supabase
      .from("focus_participants" as any)
      .select("session_id, status")
      .eq("user_id", user.id)
      .in("status", ["joined", "invited"]);

    if (!myParts || (myParts as any[]).length === 0) {
      setActiveSession(null);
      setParticipants([]);
      return;
    }

    // Check for active/in_progress sessions
    const sessionIds = (myParts as any[]).map((p: any) => p.session_id);
    const { data: sessions } = await supabase
      .from("focus_sessions" as any)
      .select("*")
      .in("id", sessionIds)
      .in("status", ["pending", "in_progress"]);

    if (!sessions || (sessions as any[]).length === 0) {
      setActiveSession(null);
      setParticipants([]);
      return;
    }

    const session = (sessions as any[])[0] as FocusSession;
    setActiveSession(session);

    // Get participants with usernames
    const { data: parts } = await supabase
      .from("focus_participants" as any)
      .select("*")
      .eq("session_id", session.id);

    if (parts) {
      const userIds = (parts as any[]).map((p: any) => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);
      const usernameMap = new Map((profiles ?? []).map((p) => [p.id, p.username]));
      setParticipants(
        (parts as any[]).map((p: any) => ({ ...p, username: usernameMap.get(p.user_id) ?? "Unknown" }))
      );
    }
  }, [user]);

  const fetchPendingInvites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("focus_participants" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "invited");

    if (!data || (data as any[]).length === 0) {
      setPendingInvites([]);
      return;
    }

    const sessionIds = (data as any[]).map((p: any) => p.session_id);
    const { data: sessions } = await supabase
      .from("focus_sessions" as any)
      .select("*")
      .in("id", sessionIds)
      .eq("status", "pending");

    const { data: allParts } = await supabase
      .from("focus_participants" as any)
      .select("session_id, user_id")
      .in("session_id", sessionIds);

    // Get creator usernames
    const creatorIds = (sessions as any[] ?? []).map((s: any) => s.created_by);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", creatorIds);
    const usernameMap = new Map((profiles ?? []).map((p) => [p.id, p.username]));

    const sessionMap = new Map((sessions as any[] ?? []).map((s: any) => [s.id, s]));

    setPendingInvites(
      (data as any[])
        .filter((p: any) => sessionMap.has(p.session_id))
        .map((p: any) => ({
          ...p,
          session: sessionMap.get(p.session_id),
          creator_username: usernameMap.get(sessionMap.get(p.session_id)?.created_by) ?? "Unknown",
        }))
    );
  }, [user]);

  // Timer for active in_progress session
  useEffect(() => {
    if (activeSession?.status === "in_progress" && activeSession.started_at) {
      const tick = () => {
        const start = new Date(activeSession.started_at!).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    } else {
      setElapsed(0);
    }
  }, [activeSession?.status, activeSession?.started_at]);

  // Real-time subscription for session and participants changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("focus-session-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "focus_sessions" }, () => {
        fetchActiveSession();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "focus_participants" }, () => {
        fetchActiveSession();
        fetchPendingInvites();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchActiveSession, fetchPendingInvites]);

  useEffect(() => { fetchActiveSession(); fetchPendingInvites(); }, [fetchActiveSession, fetchPendingInvites]);

  const createSession = async (friendId: string) => {
    if (!user) return null;
    const { data: session, error } = await supabase
      .from("focus_sessions" as any)
      .insert({ created_by: user.id, focus_duration: 3000, break_duration: 600 } as any)
      .select()
      .single();
    if (error || !session) return null;

    const s = session as any;

    // Add creator as participant
    await supabase.from("focus_participants" as any).insert({ session_id: s.id, user_id: user.id, status: "joined", joined_at: new Date().toISOString() } as any);
    // Invite friend
    await supabase.from("focus_participants" as any).insert({ session_id: s.id, user_id: friendId, status: "invited" } as any);

    // Get creator username
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();

    // Notify friend
    await supabase.from("notifications" as any).insert({
      user_id: friendId,
      type: "focus_invite",
      title: "Focus Session Invite",
      body: `${profile?.username ?? "Someone"} invited you to a 50-minute focus session`,
      data: { session_id: s.id, from_user_id: user.id },
    } as any);

    await fetchActiveSession();
    return s.id;
  };

  const acceptInvite = async (participantId: string, sessionId: string) => {
    await supabase.from("focus_participants" as any)
      .update({ status: "joined", joined_at: new Date().toISOString() } as any)
      .eq("id", participantId);

    // Check if all participants joined, if so start the session
    const { data: parts } = await supabase
      .from("focus_participants" as any)
      .select("status")
      .eq("session_id", sessionId);

    const allJoined = (parts as any[] ?? []).every((p: any) => p.status === "joined");
    if (allJoined) {
      await supabase.from("focus_sessions" as any)
        .update({ status: "in_progress", started_at: new Date().toISOString() } as any)
        .eq("id", sessionId);
    }

    await fetchActiveSession();
    await fetchPendingInvites();
  };

  const declineInvite = async (participantId: string) => {
    await supabase.from("focus_participants" as any)
      .update({ status: "declined" } as any)
      .eq("id", participantId);
    await fetchPendingInvites();
  };

  const leaveSession = async () => {
    if (!user || !activeSession) return;
    const now = new Date().toISOString();

    // Mark self as left
    await supabase.from("focus_participants" as any)
      .update({ status: "left", left_at: now, points_earned: elapsed >= activeSession.focus_duration ? 50 : 10 } as any)
      .eq("session_id", activeSession.id)
      .eq("user_id", user.id);

    // Update profile battle points
    const pointsEarned = elapsed >= activeSession.focus_duration ? 50 : 10;
    await supabase.from("profiles")
      .update({
        battle_points: (await supabase.from("profiles").select("battle_points").eq("id", user.id).maybeSingle()).data?.battle_points + pointsEarned
      } as any)
      .eq("id", user.id);

    // If early leave, other participant wins
    if (elapsed < activeSession.focus_duration) {
      const otherParticipant = participants.find((p) => p.user_id !== user.id && p.status === "joined");
      if (otherParticipant) {
        await supabase.from("focus_participants" as any)
          .update({ points_earned: 80 } as any) // 50 + 30 bonus
          .eq("id", otherParticipant.id);
        await supabase.from("profiles")
          .update({
            battle_points: (await supabase.from("profiles").select("battle_points, battle_wins").eq("id", otherParticipant.user_id).maybeSingle()).data?.battle_points + 80,
            battle_wins: (await supabase.from("profiles").select("battle_wins").eq("id", otherParticipant.user_id).maybeSingle()).data?.battle_wins + 1,
          } as any)
          .eq("id", otherParticipant.user_id);
      }
    }

    // Check if all participants left, end the session
    const { data: remaining } = await supabase
      .from("focus_participants" as any)
      .select("status")
      .eq("session_id", activeSession.id)
      .eq("status", "joined");

    if (!remaining || (remaining as any[]).length === 0) {
      await supabase.from("focus_sessions" as any)
        .update({ status: "completed", ended_at: now } as any)
        .eq("id", activeSession.id);
    }

    // Also add study minutes for time spent
    const minutesStudied = Math.floor(elapsed / 60);
    if (minutesStudied > 0) {
      await supabase.rpc("increment_study_minutes" as any, { p_user_id: user.id, p_minutes: minutesStudied });
    }

    await fetchActiveSession();
  };

  const completeSession = async () => {
    if (!user || !activeSession) return;
    const now = new Date().toISOString();

    // Award full points to all remaining participants
    for (const p of participants.filter((p) => p.status === "joined")) {
      await supabase.from("focus_participants" as any)
        .update({ status: "completed", left_at: now, points_earned: 50 } as any)
        .eq("id", p.id);
      await supabase.from("profiles")
        .update({
          battle_points: (await supabase.from("profiles").select("battle_points").eq("id", p.user_id).maybeSingle()).data?.battle_points + 50,
        } as any)
        .eq("id", p.user_id);

      // Add study minutes
      const mins = Math.floor(activeSession.focus_duration / 60);
      await supabase.rpc("increment_study_minutes" as any, { p_user_id: p.user_id, p_minutes: mins });
    }

    await supabase.from("focus_sessions" as any)
      .update({ status: "completed", ended_at: now } as any)
      .eq("id", activeSession.id);

    await fetchActiveSession();
  };

  // Compute phase
  const totalDuration = activeSession ? activeSession.focus_duration + activeSession.break_duration : 0;
  const isFocusPhase = elapsed < (activeSession?.focus_duration ?? 0);
  const isBreakPhase = !isFocusPhase && elapsed < totalDuration;
  const isCompleted = elapsed >= totalDuration;
  const phaseRemaining = isFocusPhase
    ? (activeSession?.focus_duration ?? 0) - elapsed
    : isBreakPhase
    ? totalDuration - elapsed
    : 0;

  return {
    activeSession,
    participants,
    pendingInvites,
    elapsed,
    isFocusPhase,
    isBreakPhase,
    isCompleted,
    phaseRemaining,
    createSession,
    acceptInvite,
    declineInvite,
    leaveSession,
    completeSession,
    refresh: fetchActiveSession,
  };
}
