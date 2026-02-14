import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Target } from "lucide-react";

interface DailyCommitmentProps {
  userId: string;
  todayHours: number;
  commitment: { target_hours: number } | null;
  onCommitmentSet: () => void;
}

export default function DailyCommitment({ userId, todayHours, commitment, onCommitmentSet }: DailyCommitmentProps) {
  const { toast } = useToast();
  const [selectedHours, setSelectedHours] = useState(2);
  const [saving, setSaving] = useState(false);

  const handleSetCommitment = async () => {
    setSaving(true);
    const { error } = await supabase.from("daily_commitments").insert({
      user_id: userId,
      target_hours: selectedHours,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Commitment set!", description: `${selectedHours}h goal for today 🎯` });
      onCommitmentSet();
    }
    setSaving(false);
  };

  if (!commitment) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Target size={16} />
          <p className="text-sm font-body">Set today's study goal</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3, 4, 5].map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHours(h)}
              className={`w-10 h-10 rounded-lg font-serif text-sm border transition-colors ${
                selectedHours === h
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground hover:border-primary/50"
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
        <Button
          onClick={handleSetCommitment}
          disabled={saving}
          variant="outline"
          size="sm"
          className="font-body"
        >
          {saving ? "Saving..." : "Commit"}
        </Button>
      </div>
    );
  }

  const progress = Math.min(100, (todayHours / commitment.target_hours) * 100);
  const completed = todayHours >= commitment.target_hours;

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Target size={16} />
          <p className="text-sm font-body">Today's Goal</p>
        </div>
        <p className="text-sm font-serif font-bold text-foreground">
          {todayHours} / {commitment.target_hours}h
        </p>
      </div>
      <Progress value={progress} className="h-2" />
      {completed && (
        <p className="text-xs text-primary font-body text-center">Goal completed! +20 bonus points ✓</p>
      )}
    </div>
  );
}
