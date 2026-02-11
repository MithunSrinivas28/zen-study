import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  username: string;
  total_hours: number;
  joined_at: string;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, total_hours, joined_at")
        .order("total_hours", { ascending: false })
        .limit(20);
      setEntries(data ?? []);
      setLoading(false);
    };
    fetch();
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
            return (
              <div
                key={entry.username}
                className="flex items-center gap-4 bg-card border border-border rounded-lg px-5 py-4 animate-float-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-lg font-serif font-bold text-muted-foreground w-8 text-right">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-foreground truncate">{entry.username}</p>
                  <p className="text-xs text-muted-foreground font-body">
                    Since {daysSinceJoined} day{daysSinceJoined !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-serif font-bold text-foreground">{entry.total_hours}</p>
                  <p className="text-xs text-muted-foreground font-body">hours</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
