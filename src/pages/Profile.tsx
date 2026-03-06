import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import StreakGrid from "@/components/StreakGrid";
import { Star, Calendar, TrendingUp, Clock, Trophy, Hash } from "lucide-react";

interface ProfileData {
  username: string;
  total_hours: number;
  points: number;
  joined_at: string;
}

interface StudySession {
  mode: string;
  duration_seconds: number;
  sessions_completed: number;
  created_at: string;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [studyLogs, setStudyLogs] = useState<{ logged_at: string }[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (!user) return;

    const fetchAll = async () => {
      const [{ data: p }, { data: logs }, { data: sess }, { data: allProfiles }] = await Promise.all([
        supabase.from("profiles").select("username, total_hours, points, joined_at").eq("id", user.id).maybeSingle(),
        supabase.from("study_logs").select("logged_at").eq("user_id", user.id).order("logged_at", { ascending: false }),
        supabase.from("study_sessions").select("mode, duration_seconds, sessions_completed, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, total_hours").order("total_hours", { ascending: false }),
      ]);
      if (p) setProfile(p);
      setStudyLogs(logs ?? []);
      setSessions(sess ?? []);
      if (allProfiles) {
        const idx = allProfiles.findIndex((pr) => pr.id === user.id);
        setRank(idx >= 0 ? idx + 1 : null);
      }
    };
    fetchAll();
  }, [user, authLoading, navigate]);

  const analytics = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const dayMap: Record<string, number> = {};
    let weekHours = 0;

    for (const log of studyLogs) {
      const d = new Date(log.logged_at);
      const dateStr = d.toISOString().split("T")[0];
      dayMap[dateStr] = (dayMap[dateStr] ?? 0) + 1;
      if (d >= weekAgo) weekHours++;
    }

    // Add stopwatch session hours
    const stopwatchSeconds = sessions
      .filter((s) => s.mode === "stopwatch")
      .reduce((sum, s) => sum + s.duration_seconds, 0);
    const totalSessionCount = sessions.reduce((sum, s) => sum + s.sessions_completed, 0);

    const bestDayHours = Object.values(dayMap).length > 0 ? Math.max(...Object.values(dayMap)) : 0;
    const totalDays = Object.keys(dayMap).length;
    const avgHours = totalDays > 0 ? studyLogs.length / totalDays : 0;

    return { weekHours, bestDayHours, avgSessionLength: avgHours >= 1 ? `${avgHours.toFixed(1)}h` : "—", totalSessionCount, stopwatchHours: Math.floor(stopwatchSeconds / 3600) };
  }, [studyLogs, sessions]);

  if (authLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground font-body animate-pulse">Loading...</p>
      </div>
    );
  }

  const stats = [
    { icon: Star, label: "Total Points", value: profile.points.toString() },
    { icon: Calendar, label: "This Week", value: `${analytics.weekHours}h` },
    { icon: TrendingUp, label: "Best Day", value: `${analytics.bestDayHours}h` },
    { icon: Clock, label: "Avg / Day", value: analytics.avgSessionLength },
    { icon: Hash, label: "Sessions", value: analytics.totalSessionCount.toString() },
    { icon: Trophy, label: "Rank", value: rank ? `#${rank}` : "—" },
  ];

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">{profile.username}</h1>
        <p className="text-4xl font-serif font-bold text-foreground mt-2">{profile.total_hours}h</p>
        <p className="text-xs text-muted-foreground font-body">Total Study Time</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card rounded-lg border border-border p-3 text-center">
            <Icon size={14} className="mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-serif font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground font-body">{label}</p>
          </div>
        ))}
      </div>

      {/* Study Activity Grid */}
      <div className="mb-8">
        <h2 className="text-sm font-body text-muted-foreground mb-3 text-center">Study Activity</h2>
        <div className="bg-card rounded-lg border border-border p-4 overflow-hidden">
          <StreakGrid logs={studyLogs} sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
