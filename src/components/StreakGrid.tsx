import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Session {
  duration_seconds: number;
  sessions_completed: number;
  created_at: string;
}

interface StreakGridProps {
  logs: { logged_at: string }[];
  sessions?: Session[];
  weeks?: number;
}

export default function StreakGrid({ logs, sessions = [], weeks = 20 }: StreakGridProps) {
  const { grid, monthLabels, currentStreak, longestStreak } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - weeks * 7 + 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Compute minutes per day from sessions
    const minuteMap = new Map<string, number>();
    const sessionCountMap = new Map<string, number>();

    for (const sess of sessions) {
      const d = new Date(sess.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      minuteMap.set(key, (minuteMap.get(key) ?? 0) + Math.floor(sess.duration_seconds / 60));
      sessionCountMap.set(key, (sessionCountMap.get(key) ?? 0) + sess.sessions_completed);
    }

    // Also add study_logs as 60 min each (legacy hour increments)
    for (const log of logs) {
      const d = new Date(log.logged_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      minuteMap.set(key, (minuteMap.get(key) ?? 0) + 60);
      sessionCountMap.set(key, (sessionCountMap.get(key) ?? 0) + 1);
    }

    // Build grid
    const cols: { date: Date; minutes: number; sessionCount: number }[][] = [];
    const labels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;
    const cursor = new Date(startDate);

    while (cursor <= today) {
      const col: { date: Date; minutes: number; sessionCount: number }[] = [];
      for (let row = 0; row < 7; row++) {
        const d = new Date(cursor);
        d.setDate(d.getDate() + row);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        col.push({
          date: new Date(d),
          minutes: d <= today ? (minuteMap.get(key) ?? 0) : -1,
          sessionCount: d <= today ? (sessionCountMap.get(key) ?? 0) : 0,
        });
        if (row === 0 && d.getMonth() !== lastMonth && d <= today) {
          lastMonth = d.getMonth();
          labels.push({ label: d.toLocaleString("default", { month: "short" }), colIndex: cols.length });
        }
      }
      cols.push(col);
      cursor.setDate(cursor.getDate() + 7);
    }

    // Streaks (any day with > 0 minutes counts)
    let current = 0;
    const check = new Date(today);
    while (true) {
      const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
      if ((minuteMap.get(key) ?? 0) > 0) {
        current++;
        check.setDate(check.getDate() - 1);
      } else break;
    }

    let longest = 0, streak = 0;
    const iter = new Date(startDate);
    while (iter <= today) {
      const key = `${iter.getFullYear()}-${iter.getMonth()}-${iter.getDate()}`;
      if ((minuteMap.get(key) ?? 0) > 0) {
        streak++;
        longest = Math.max(longest, streak);
      } else streak = 0;
      iter.setDate(iter.getDate() + 1);
    }

    return { grid: cols, monthLabels: labels, currentStreak: current, longestStreak: longest };
  }, [logs, sessions, weeks]);

  const getColor = (minutes: number) => {
    if (minutes < 0) return "bg-transparent";
    if (minutes === 0) return "bg-muted";
    if (minutes <= 30) return "bg-primary/30";
    if (minutes <= 60) return "bg-primary/50";
    if (minutes <= 120) return "bg-primary/75";
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
                if (!cell || cell.minutes < 0) {
                  return <div key={colIdx} style={{ width: 12, height: 12, minWidth: 12 }} />;
                }
                return (
                  <Tooltip key={colIdx}>
                    <TooltipTrigger asChild>
                      <div
                        className={`rounded-[2px] ${getColor(cell.minutes)} transition-colors cursor-default`}
                        style={{ width: 12, height: 12, minWidth: 12 }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs font-body">
                      <p className="font-medium">{cell.date.toLocaleDateString()}</p>
                      <p>{cell.minutes} min studied</p>
                      <p>{cell.sessionCount} session{cell.sessionCount !== 1 ? "s" : ""}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground font-body justify-end">
            <span>Less</span>
            <div className="w-3 h-3 rounded-[2px] bg-muted" />
            <div className="w-3 h-3 rounded-[2px] bg-primary/30" />
            <div className="w-3 h-3 rounded-[2px] bg-primary/50" />
            <div className="w-3 h-3 rounded-[2px] bg-primary/75" />
            <div className="w-3 h-3 rounded-[2px] bg-primary" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
