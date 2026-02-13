import { useEffect, useRef, useState } from "react";

interface FloatingTimerProps {
  cooldown: number; // seconds remaining
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function playCompletionSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch {
    // Audio not supported
  }
}

export default function FloatingTimer({ cooldown }: FloatingTimerProps) {
  const prevCooldown = useRef(cooldown);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (prevCooldown.current > 0 && cooldown === 0) {
      playCompletionSound();
      setJustCompleted(true);
      const t = setTimeout(() => setJustCompleted(false), 3000);
      return () => clearTimeout(t);
    }
    prevCooldown.current = cooldown;
  }, [cooldown]);

  if (cooldown <= 0 && !justCompleted) return null;

  const progress = Math.max(0, 1 - cooldown / 3600);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-float-up">
      <div className="bg-card border border-border rounded-2xl shadow-lg px-5 py-4 flex items-center gap-4 min-w-[180px]">
        {/* Circular progress */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle
              cx="24" cy="24" r="20" fill="none"
              stroke={justCompleted ? "hsl(var(--primary))" : "hsl(var(--accent))"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-body text-muted-foreground">
            {justCompleted ? "✓" : `${Math.floor(cooldown / 60)}m`}
          </span>
        </div>
        <div>
          {justCompleted ? (
            <p className="text-sm font-body font-medium text-primary">Ready to study!</p>
          ) : (
            <>
              <p className="text-lg font-serif font-bold text-foreground tabular-nums tracking-tight">
                {formatCountdown(cooldown)}
              </p>
              <p className="text-[11px] text-muted-foreground font-body">until next hour</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
