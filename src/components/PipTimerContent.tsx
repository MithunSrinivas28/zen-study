interface PipTimerContentProps {
  cooldown: number;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function PipTimerContent({ cooldown }: PipTimerContentProps) {
  const progress = Math.max(0, 1 - cooldown / 3600);
  const ready = cooldown <= 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: '"Noto Serif JP", serif',
        background: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
        margin: 0,
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      {/* Circular progress */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        style={{ marginBottom: 12, transform: "rotate(-90deg)" }}
      >
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="4"
        />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke={ready ? "hsl(var(--primary))" : "hsl(var(--accent))"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 34}`}
          strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress)}`}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>

      {ready ? (
        <p
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "hsl(var(--primary))",
            textAlign: "center",
          }}
        >
          Ready to log next hour
        </p>
      ) : (
        <p
          style={{
            fontSize: "28px",
            fontWeight: 700,
            letterSpacing: "0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatCountdown(cooldown)}
        </p>
      )}
    </div>
  );
}
