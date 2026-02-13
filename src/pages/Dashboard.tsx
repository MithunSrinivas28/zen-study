import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StreakGrid from "@/components/StreakGrid";
import FloatingTimer from "@/components/FloatingTimer";
import PipTimerContent from "@/components/PipTimerContent";
import { usePictureInPicture } from "@/hooks/usePictureInPicture";
import { PictureInPicture2 } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Profile {
  username: string;
  total_hours: number;
  last_increment: string | null;
  joined_at: string;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studyLogs, setStudyLogs] = useState<{ logged_at: string }[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [incrementing, setIncrementing] = useState(false);
  const { isSupported: pipSupported, isOpen: pipOpen, toggle: togglePip, Portal: PipPortal } = usePictureInPicture();

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const [{ data: profileData }, { data: logsData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("username, total_hours, last_increment, joined_at")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("study_logs")
        .select("logged_at")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false }),
    ]);
    if (profileData) setProfile(profileData);
    setStudyLogs(logsData ?? []);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
  }, [user, authLoading, navigate, fetchProfile]);

  // Cooldown timer
  useEffect(() => {
    if (!profile?.last_increment) return;
    const calcRemaining = () => {
      const last = new Date(profile.last_increment!).getTime();
      const remaining = Math.max(0, Math.ceil((last + 3600000 - Date.now()) / 1000));
      setCooldown(remaining);
    };
    calcRemaining();
    const interval = setInterval(calcRemaining, 1000);
    return () => clearInterval(interval);
  }, [profile?.last_increment]);

  const handleIncrement = async () => {
    if (!user) return;
    setIncrementing(true);
    const { data, error } = await supabase.rpc("increment_study_hour", {
      p_user_id: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const result = data as unknown as { success: boolean; error?: string; remaining_seconds?: number };
      if (result.success) {
        toast({ title: "Study hour logged!", description: "Keep going 💪" });
        await fetchProfile();
      } else if (result.error === "cooldown") {
        setCooldown(result.remaining_seconds ?? 0);
        toast({
          title: "Cooldown active",
          description: `Wait ${formatCountdown(result.remaining_seconds ?? 0)}`,
        });
      }
    }
    setIncrementing(false);
  };

  if (authLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground font-body animate-pulse-sakura">Loading...</p>
      </div>
    );
  }

  const daysSinceJoined = Math.max(1, Math.floor((Date.now() - new Date(profile.joined_at).getTime()) / 86400000));

  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <div className="text-center mb-12 animate-float-up">
        <p className="text-muted-foreground text-sm font-body mb-1">Welcome,</p>
        <h1 className="text-3xl font-serif font-bold text-foreground">{profile.username}</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-card rounded-lg border border-border p-6 text-center">
          <p className="text-4xl font-serif font-bold text-foreground">{profile.total_hours}</p>
          <p className="text-xs text-muted-foreground font-body mt-1">Total Hours</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6 text-center">
          <p className="text-4xl font-serif font-bold text-foreground">{daysSinceJoined}</p>
          <p className="text-xs text-muted-foreground font-body mt-1">Days Active</p>
        </div>
      </div>

      {/* Prominent +1 Hour Button */}
      <div className="mb-12">
      {cooldown > 0 ? (
          <div className="text-center space-y-3">
            <Button disabled className="w-full max-w-sm mx-auto bg-muted text-muted-foreground font-body text-lg py-7 cursor-not-allowed rounded-xl">
              Cooldown — {formatCountdown(cooldown)}
            </Button>
            <p className="text-xs text-muted-foreground font-body">Rest and return when the timer completes</p>
            {pipSupported && (
              <Button
                variant="outline"
                size="sm"
                onClick={togglePip}
                className="font-body gap-2"
              >
                <PictureInPicture2 size={16} />
                {pipOpen ? "Close Float" : "Float Timer"}
              </Button>
            )}
          </div>
        ) : (
          <Button
            onClick={handleIncrement}
            disabled={incrementing}
            className="w-full max-w-sm mx-auto bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xl py-8 rounded-xl transition-all active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span className="text-2xl">＋</span>
            {incrementing ? "Logging..." : "1 Hour"}
          </Button>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-body text-muted-foreground mb-3 text-center">Study Activity</h2>
        <div className="bg-card rounded-lg border border-border p-4 overflow-hidden">
          <StreakGrid logs={studyLogs} />
        </div>
      </div>

      <FloatingTimer cooldown={cooldown} />

      <PipPortal>
        <PipTimerContent cooldown={cooldown} />
      </PipPortal>
    </div>
  );
}
