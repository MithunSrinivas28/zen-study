import { useEffect, useRef, useState } from "react";

interface FloatingTimerProps {
  cooldown: number;
  mode?: string;
  elapsed?: number;
  phase?: string;
  isRunning?: boolean;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function FloatingTimer({ cooldown, mode, elapsed = 0, phase, isRunning }: FloatingTimerProps) {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 bg-card border border-border rounded-full w-12 h-12 flex items-center justify-center shadow-lg text-primary font-serif font-bold text-sm"
      >
        {mode === "stopwatch" ? "⏱" : `${Math.floor((mode === "timer" ? cooldown : elapsed) / 60)}m`}
      </button>
    );
  }

  const isStopwatch = mode === "stopwatch";
  const displayTime = isStopwatch ? formatElapsed(elapsed) : formatCountdown(cooldown);
  const label = isStopwatch
    ? "Studying..."
    : phase === "break"
    ? "Break"
    : phase === "focus"
    ? "Focus"
    : "Cooldown";

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-float-up">
      <div className="bg-card border border-border rounded-2xl shadow-lg px-5 py-4 flex items-center gap-4 min-w-[180px]">
        <div>
          <p className="text-lg font-serif font-bold text-foreground tabular-nums tracking-tight">
            {displayTime}
          </p>
          <p className="text-[11px] text-muted-foreground font-body">{label}</p>
        </div>
        <button
          onClick={() => setMinimized(true)}
          className="text-muted-foreground hover:text-foreground text-xs font-body"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
