import { Star, Calendar, TrendingUp, Clock } from "lucide-react";

interface AnalyticsPanelProps {
  points: number;
  weekHours: number;
  bestDayHours: number;
  avgSessionLength: string;
}

export default function AnalyticsPanel({ points, weekHours, bestDayHours, avgSessionLength }: AnalyticsPanelProps) {
  const stats = [
    { icon: Star, label: "Total Points", value: points.toString() },
    { icon: Calendar, label: "This Week", value: `${weekHours}h` },
    { icon: TrendingUp, label: "Best Day", value: `${bestDayHours}h` },
    { icon: Clock, label: "Avg Session", value: avgSessionLength },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-body text-muted-foreground text-center">Personal Analytics</h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card rounded-lg border border-border p-4 text-center">
            <Icon size={14} className="mx-auto mb-1.5 text-muted-foreground" />
            <p className="text-2xl font-serif font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
