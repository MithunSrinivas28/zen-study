import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StreakGrid from "@/components/StreakGrid";

interface LeaderboardEntry {
  id: string;
  username: string;
  total_hours: number;
  joined_at: string;
  study_logs: { logged_at: string }[];
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, total_hours, joined_at")
        .order("total_hours", { ascending: false })
        .limit(20);

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Fetch study logs for all users
      const userIds = profiles.map((p) => p.id);
      const { data: logs } = await supabase
        .from("study_logs")
        .select("user_id, logged_at")
        .in("user_id", userIds)
        .order("logged_at", { ascending: false });

      const logsByUser = new Map<string, { logged_at: string }[]>();
      for (const log of logs ?? []) {
        const arr = logsByUser.get(log.user_id) ?? [];
        arr.push({ logged_at: log.logged_at });
        logsByUser.set(log.user_id, arr);
      }

      setEntries(
        profiles.map((p) => ({
          ...p,
          study_logs: logsByUser.get(p.id) ?? [],
        }))
      );
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground font-body animate-pulse-sakura">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Leaderboard</h1>
        <p className="text-muted-foreground text-sm font-body">Top 20 scholars — all-time hours</p>
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-muted-foreground font-body">No entries yet. Be the first!</p>
      ) : (
        <div className="space-y-2">
            {entries.map((entry, i) => {
            const daysSinceJoined = Math.max(
              1,
              Math.floor((Date.now() - new Date(entry.joined_at).getTime()) / 86400000)
            );
            // Compute current streak
            const logDates = new Set(
              entry.study_logs.map((l) => {
                const d = new Date(l.logged_at);
                return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              })
            );
            let streak = 0;
            const check = new Date();
            check.setHours(0, 0, 0, 0);
            while (logDates.has(`${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`)) {
              streak++;
              check.setDate(check.getDate() - 1);
            }

            return (
              <div key={entry.id}>
                <button
                  onClick={() => setExpandedUser(expandedUser === entry.id ? null : entry.id)}
                  className="w-full flex items-center gap-4 bg-card border border-border rounded-lg px-5 py-4 animate-float-up text-left hover:bg-card/80 transition-colors"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="text-lg font-serif font-bold text-muted-foreground w-8 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-foreground truncate">{entry.username}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      Since {daysSinceJoined} day{daysSinceJoined !== 1 ? "s" : ""}
                      {streak > 0 && <span className="ml-2">🔥 {streak}d streak</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-serif font-bold text-foreground">{entry.total_hours}</p>
                    <p className="text-xs text-muted-foreground font-body">hours</p>
                  </div>
                </button>
                {expandedUser === entry.id && (
                  <div className="bg-card border border-t-0 border-border rounded-b-lg px-5 py-4 -mt-1">
                    <StreakGrid logs={entry.study_logs} weeks={12} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
