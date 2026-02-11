import { useMemo } from "react";

interface StreakGridProps {
  logs: { logged_at: string }[];
  weeks?: number;
}

export default function StreakGrid({ logs, weeks = 20 }: StreakGridProps) {
  const { grid, monthLabels, currentStreak, longestStreak } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Count hours per day
    const countMap = new Map<string, number>();
    for (const log of logs) {
      const d = new Date(log.logged_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }

    // Build column-first grid (7 rows x N columns)
    const cols: { date: Date; count: number }[][] = [];
    const labels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;
    const cursor = new Date(startDate);

    while (cursor <= today) {
      const col: { date: Date; count: number }[] = [];
      for (let row = 0; row < 7; row++) {
        const d = new Date(cursor);
        d.setDate(d.getDate() + row);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        col.push({ date: new Date(d), count: d <= today ? (countMap.get(key) ?? 0) : -1 });
        if (row === 0 && d.getMonth() !== lastMonth && d <= today) {
          lastMonth = d.getMonth();
          labels.push({
            label: d.toLocaleString("default", { month: "short" }),
            colIndex: cols.length,
          });
        }
      }
      cols.push(col);
      cursor.setDate(cursor.getDate() + 7);
    }

    // Calculate streaks
    let current = 0;
    let longest = 0;
    let streak = 0;

    // Go from today backwards
    const check = new Date(today);
    while (true) {
      const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
      if (countMap.has(key)) {
        current++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak from all days
    const allDays: string[] = [];
    const iter = new Date(startDate);
    while (iter <= today) {
      allDays.push(`${iter.getFullYear()}-${iter.getMonth()}-${iter.getDate()}`);
      iter.setDate(iter.getDate() + 1);
    }
    for (const day of allDays) {
      if (countMap.has(day)) {
        streak++;
        longest = Math.max(longest, streak);
      } else {
        streak = 0;
      }
    }

    return { grid: cols, monthLabels: labels, currentStreak: current, longestStreak: longest };
  }, [logs, weeks]);

  const getColor = (count: number) => {
    if (count < 0) return "bg-transparent";
    if (count === 0) return "bg-muted";
    if (count === 1) return "bg-primary/40";
    if (count <= 3) return "bg-primary/65";
    return "bg-primary";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-6 text-xs font-body text-muted-foreground">
        <span>🔥 Current: <strong className="text-foreground">{currentStreak}d</strong></span>
        <span>🏆 Longest: <strong className="text-foreground">{longestStreak}d</strong></span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex mb-1 ml-0" style={{ gap: "3px" }}>
            {grid.map((_, colIdx) => {
              const label = monthLabels.find((l) => l.colIndex === colIdx);
              return (
                <div key={colIdx} className="text-[10px] text-muted-foreground font-body" style={{ width: 12, minWidth: 12 }}>
                  {label?.label ?? ""}
                </div>
              );
            })}
          </div>
          {/* Grid rows */}
          {[0, 1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="flex" style={{ gap: "3px", marginBottom: "3px" }}>
              {grid.map((col, colIdx) => {
                const cell = col[row];
                if (!cell || cell.count < 0) {
                  return <div key={colIdx} style={{ width: 12, height: 12, minWidth: 12 }} />;
                }
                return (
                  <div
                    key={colIdx}
                    className={`rounded-[2px] ${getColor(cell.count)} transition-colors`}
                    style={{ width: 12, height: 12, minWidth: 12 }}
                    title={`${cell.date.toLocaleDateString()} — ${cell.count} hour${cell.count !== 1 ? "s" : ""}`}
                  />
                );
              })}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground font-body justify-end">
            <span>Less</span>
            <div className="w-3 h-3 rounded-[2px] bg-muted" />
            <div className="w-3 h-3 rounded-[2px] bg-primary/40" />
            <div className="w-3 h-3 rounded-[2px] bg-primary/65" />
            <div className="w-3 h-3 rounded-[2px] bg-primary" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
