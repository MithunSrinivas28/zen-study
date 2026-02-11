import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
      <div className="animate-float-up">
        <p className="text-6xl mb-6">🌸</p>
        <h1 className="text-5xl font-serif font-bold text-foreground mb-4 tracking-tight">
          Shūkan
        </h1>
        <p className="text-lg text-muted-foreground font-body mb-2">
          習慣 — The art of consistent study
        </p>
        <p className="text-sm text-muted-foreground font-body max-w-md mx-auto mb-10">
          Log one verified study hour at a time. Build discipline. Rise on the leaderboard.
          No shortcuts, no cheating — just honest effort.
        </p>
        <div className="flex items-center justify-center gap-4">
          {user ? (
            <Link to="/dashboard">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-body px-8 py-5 text-base">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-body px-8 py-5 text-base">
                Get Started
              </Button>
            </Link>
          )}
          <Link to="/leaderboard">
            <Button variant="outline" className="font-body px-8 py-5 text-base border-border text-foreground hover:bg-card">
              Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
