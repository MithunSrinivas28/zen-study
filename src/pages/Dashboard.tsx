import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DailyCommitment from "@/components/DailyCommitment";
import SakuraTree from "@/components/SakuraTree";
import FocusRooms from "@/components/FocusRooms";
import TimerMode from "@/components/TimerMode";
import StopwatchMode from "@/components/StopwatchMode";
import { useTimerState, type StudyMode } from "@/hooks/useTimerState";

interface Profile {
  username: string;
  total_hours: number;
  points: number;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<{ mode: string; duration_seconds: number; sessions_completed: number; created_at: string }[]>([]);
  const [commitment, setCommitment] = useState<{ target_hours: number } | null>(null);
  const [studyLogs, setStudyLogs] = useState<{ logged_at: string }[]>([]);
  const [showFocusRooms, setShowFocusRooms] = useState(false);

  const timer = useTimerState();

  const fetchData = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const [{ data: p }, { data: sess }, { data: commitData }, { data: logs }] = await Promise.all([
      supabase.from("profiles").select("username, total_hours, points").eq("id", user.id).maybeSingle(),
      supabase.from("study_sessions").select("mode, duration_seconds, sessions_completed, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("daily_commitments").select("target_hours").eq("user_id", user.id).eq("commitment_date", today).maybeSingle(),
      supabase.from("study_logs").select("logged_at").eq("user_id", user.id).order("logged_at", { ascending: false }),
    ]);
    if (p) setProfile(p);
    setSessions(sess ?? []);
    setCommitment(commitData ?? null);
    setStudyLogs(logs ?? []);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, authLoading, navigate, fetchData]);

  // Compute today's hours from study_logs
  const todayStr = new Date().toISOString().split("T")[0];
  const todayHours = studyLogs.filter((l) => l.logged_at.startsWith(todayStr)).length;

  // Compute today's session stats
  const todaySessions = sessions.filter((s) => s.created_at.startsWith(todayStr));
  const todayTimerSessions = todaySessions.filter((s) => s.mode === "timer").reduce((sum, s) => sum + s.sessions_completed, 0);
  const todayStopwatchMinutes = Math.floor(todaySessions.filter((s) => s.mode === "stopwatch").reduce((sum, s) => sum + s.duration_seconds, 0) / 60);

  // Total for tree
  const totalSessions = sessions.reduce((sum, s) => sum + s.sessions_completed, 0);

  if (authLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground font-body animate-pulse">Loading...</p>
      </div>
    );
  }


  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Welcome */}
      <div className="text-center mb-6">
        <p className="text-muted-foreground text-sm font-body mb-1">Welcome,</p>
        <h1 className="text-3xl font-serif font-bold text-foreground">{profile.username}</h1>
      </div>

      {/* Start Study Together */}
      <button
        onClick={() => setShowFocusRooms((v) => !v)}
        className="w-full mb-6 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg px-5 py-3 text-center transition-colors"
      >
        <span className="font-serif font-bold text-foreground text-sm">🤝 Start Study Together</span>
        <p className="text-xs text-muted-foreground font-body mt-0.5">Invite a friend to a shared focus session</p>
      </button>

      {showFocusRooms && (
        <div className="mb-6">
          <FocusRooms />
        </div>
      )}

      {/* Sakura Tree */}
      <div className="mb-6">
        <SakuraTree totalHours={profile.total_hours} totalSessions={totalSessions} />
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center gap-3 mb-6">
        {(["timer", "stopwatch"] as StudyMode[]).map((m) => (
          <button
            key={m}
            onClick={() => timer.setMode(m)}
            disabled={timer.isRunning}
            className={`px-5 py-2.5 rounded-lg text-sm font-body border transition-colors ${
              timer.mode === m
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/50"
            } disabled:opacity-50`}
          >
            {m === "timer" ? "⏱ Timer" : "⏱ Stopwatch"}
          </button>
        ))}
      </div>

      {/* Active Mode */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        {timer.mode === "timer" ? (
          <TimerMode
            userId={user!.id}
            phase={timer.phase}
            isRunning={timer.isRunning}
            remaining={timer.remaining}
            elapsed={timer.elapsed}
            intervalType={timer.intervalType}
            sessionsCompleted={timer.sessionsCompleted}
            focusDuration={timer.focusDuration}
            onSetIntervalType={timer.setIntervalType}
            onStart={timer.start}
            onPause={timer.pause}
            onCompleteSession={timer.completeTimerSession}
            onSessionLogged={fetchData}
          />
        ) : (
          <StopwatchMode
            userId={user!.id}
            isRunning={timer.isRunning}
            elapsed={timer.elapsed}
            phase={timer.phase}
            onStart={timer.start}
            onPause={timer.pause}
            onStop={timer.stop}
            onSessionLogged={fetchData}
          />
        )}
      </div>

      {/* Daily Commitment (single goal section) */}
      <div className="mb-6">
        <DailyCommitment
          userId={user!.id}
          todayHours={todayHours + Math.floor(todayStopwatchMinutes / 60)}
          commitment={commitment}
          onCommitmentSet={fetchData}
        />
      </div>

      {/* Today's quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <p className="text-2xl font-serif font-bold text-foreground">{todayTimerSessions}</p>
          <p className="text-xs text-muted-foreground font-body">Timer Sessions</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <p className="text-2xl font-serif font-bold text-foreground">{todayStopwatchMinutes}m</p>
          <p className="text-xs text-muted-foreground font-body">Stopwatch Time</p>
        </div>
      </div>

      {/* Focus Rooms - shown via the "Start Study Together" button above */}
    </div>
  );
}
