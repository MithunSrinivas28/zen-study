interface SakuraTreeProps {
  totalHours: number;
  totalSessions: number;
}

function getStage(hours: number, sessions: number): { name: string; level: number } {
  const score = hours + sessions * 0.5;
  if (score >= 100) return { name: "Blossom", level: 5 };
  if (score >= 50) return { name: "Mature tree", level: 4 };
  if (score >= 20) return { name: "Young tree", level: 3 };
  if (score >= 5) return { name: "Sprout", level: 2 };
  return { name: "Seed", level: 1 };
}

export default function SakuraTree({ totalHours, totalSessions }: SakuraTreeProps) {
  const stage = getStage(totalHours, totalSessions);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Ground */}
          <ellipse cx="50" cy="88" rx="30" ry="4" fill="hsl(var(--muted))" opacity="0.5" />

          {stage.level === 1 && (
            /* Seed */
            <g>
              <ellipse cx="50" cy="82" rx="6" ry="4" fill="hsl(var(--stone))" />
              <circle cx="50" cy="79" r="2" fill="hsl(var(--primary))" opacity="0.6" />
            </g>
          )}

          {stage.level === 2 && (
            /* Sprout */
            <g>
              <line x1="50" y1="86" x2="50" y2="68" stroke="hsl(var(--stone))" strokeWidth="2" strokeLinecap="round" />
              <ellipse cx="46" cy="70" rx="5" ry="3" fill="hsl(var(--primary))" opacity="0.5" transform="rotate(-20 46 70)" />
              <ellipse cx="54" cy="72" rx="5" ry="3" fill="hsl(var(--primary))" opacity="0.4" transform="rotate(15 54 72)" />
            </g>
          )}

          {stage.level === 3 && (
            /* Young tree */
            <g>
              <line x1="50" y1="86" x2="50" y2="50" stroke="hsl(var(--stone))" strokeWidth="3" strokeLinecap="round" />
              <line x1="50" y1="60" x2="38" y2="50" stroke="hsl(var(--stone))" strokeWidth="2" strokeLinecap="round" />
              <line x1="50" y1="55" x2="62" y2="46" stroke="hsl(var(--stone))" strokeWidth="2" strokeLinecap="round" />
              {[40, 55, 35, 60, 48].map((x, i) => (
                <circle key={i} cx={x} cy={42 + (i % 3) * 5} r="4" fill="hsl(var(--primary))" opacity={0.3 + i * 0.1} />
              ))}
            </g>
          )}

          {stage.level === 4 && (
            /* Mature tree */
            <g>
              <path d="M50 86 Q50 60 48 45" stroke="hsl(var(--stone))" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M49 58 Q40 48 32 42" stroke="hsl(var(--stone))" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M50 52 Q60 44 66 38" stroke="hsl(var(--stone))" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M48 48 Q44 40 40 35" stroke="hsl(var(--stone))" strokeWidth="2" fill="none" strokeLinecap="round" />
              {[30, 38, 45, 52, 60, 68, 35, 55, 42, 48, 62].map((x, i) => (
                <circle key={i} cx={x} cy={28 + (i % 4) * 6} r="5" fill="hsl(var(--primary))" opacity={0.25 + (i % 3) * 0.1} />
              ))}
            </g>
          )}

          {stage.level === 5 && (
            /* Full blossom */
            <g>
              <path d="M50 86 Q49 55 47 38" stroke="hsl(var(--stone))" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M48 55 Q36 42 28 35" stroke="hsl(var(--stone))" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M49 48 Q62 38 70 30" stroke="hsl(var(--stone))" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M47 42 Q40 32 35 26" stroke="hsl(var(--stone))" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M48 50 Q55 45 58 40" stroke="hsl(var(--stone))" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Blossoms */}
              {[
                [25, 30], [32, 24], [40, 20], [50, 18], [58, 22], [66, 28], [72, 26],
                [28, 38], [36, 32], [44, 26], [54, 24], [62, 30], [70, 34],
                [34, 40], [42, 34], [52, 32], [60, 36], [46, 28], [38, 28],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={4 + (i % 3)} fill="hsl(var(--primary))" opacity={0.2 + (i % 4) * 0.08}>
                  <animate attributeName="opacity" values={`${0.2 + (i % 4) * 0.08};${0.4 + (i % 3) * 0.1};${0.2 + (i % 4) * 0.08}`} dur={`${3 + (i % 3)}s`} repeatCount="indefinite" />
                </circle>
              ))}
            </g>
          )}
        </svg>
      </div>
      <p className="text-xs text-muted-foreground font-body">{stage.name}</p>
    </div>
  );
}
