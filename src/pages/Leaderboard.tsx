import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  username: string;
  total_hours: number;
  joined_at: string;
}

function getTitle(hours: number): string {
  if (hours >= 51) return "Master";
  if (hours >= 26) return "Ascetic";
  if (hours >= 11) return "Disciplined";
  return "Beginner";
}

const rankConfig: Record<number, { icon: typeof Crown; color: string; label: string }> = {
  1: { icon: Crown, color: "hsl(43 80% 65%)", label: "gold" },
  2: { icon: Medal, color: "hsl(220 10% 72%)", label: "silver" },
  3: { icon: Award, color: "hsl(30 55% 55%)", label: "bronze" },
};

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: leaderboard }, profileResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, total_hours, joined_at")
          .order("total_hours", { ascending: false })
          .limit(20),
        user
          ? supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setEntries(leaderboard ?? []);
      if (profileResult?.data) setCurrentUsername(profileResult.data.username);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground font-body animate-pulse-sakura">Loading...</p>
      </div>
    );
  }

  const leaderHours = entries.length > 0 ? entries[0].total_hours : 0;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Leaderboard</h1>
        <p className="font-body text-muted-foreground text-sm">Ranked by Real Work</p>
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-muted-foreground font-body">No entries yet. Be the first!</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const rank = i + 1;
            const config = rankConfig[rank];
            const isCurrentUser = currentUsername === entry.username;
            const gap = leaderHours - entry.total_hours;
            const daysSinceJoined = Math.max(
              1,
              Math.floor((Date.now() - new Date(entry.joined_at).getTime()) / 86400000)
            );
            const title = getTitle(entry.total_hours);

            return (
              <div
                key={entry.username}
                className={`flex items-center gap-4 rounded-lg px-5 animate-float-up transition-colors ${
                  rank === 1 ? "py-5" : "py-4"
                } ${
                  isCurrentUser
                    ? "bg-primary/10 border-2 border-primary/30"
                    : "bg-card border border-border"
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Rank */}
                <div className="w-10 flex items-center justify-center">
                  {config ? (
                    <config.icon size={rank === 1 ? 26 : 22} style={{ color: config.color }} />
                  ) : (
                    <span className="text-lg font-serif font-bold text-muted-foreground">
                      {rank}
                    </span>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-body font-medium truncate ${
                      rank === 1 ? "text-lg text-foreground" : "text-foreground"
                    }`}
                  >
                    {entry.username}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-body italic">{title}</span>
                    <span className="text-xs text-muted-foreground/50">·</span>
                    <span className="text-xs text-muted-foreground font-body">
                      {daysSinceJoined}d
                    </span>
                  </div>
                </div>

                {/* Hours & gap */}
                <div className="text-right">
                  <p
                    className={`font-serif font-bold text-foreground ${
                      rank === 1 ? "text-2xl" : rank <= 3 ? "text-xl" : "text-lg"
                    }`}
                  >
                    {entry.total_hours}
                    <span className="text-xs text-muted-foreground font-body ml-1">h</span>
                  </p>
                  {rank > 1 && gap > 0 && (
                    <p className="text-xs text-muted-foreground font-body">
                      {gap}h behind
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
