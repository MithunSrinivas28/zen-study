import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import SpotifyMiniPlayer from "@/components/SpotifyMiniPlayer";
import MoodSelector, { useMood } from "@/components/MoodSelector";
import FloatingTimer from "@/components/FloatingTimer";
import TodoPanel from "@/components/TodoPanel";
import { useTimerState } from "@/hooks/useTimerState";

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return [dark, () => setDark((d) => !d)] as const;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [dark, toggleDark] = useDarkMode();
  const { mood, setMood } = useMood();
  const timer = useTimerState();

  const isActive = (path: string) => location.pathname === path;

  // Show floating timer when timer is running and not on dashboard
  const showFloatingTimer = timer.isRunning && location.pathname !== "/dashboard";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between max-w-4xl">
          <Link to="/" className="font-serif text-2xl font-bold tracking-tight text-foreground">
            習慣 <span className="text-sm font-body font-normal text-muted-foreground ml-1">Shūkan</span>
          </Link>
          <div className="flex items-center gap-5 text-sm font-body">
            <Link
              to="/leaderboard"
              className={`transition-colors hover:text-foreground ${
                isActive("/leaderboard") ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              Leaderboard
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`transition-colors hover:text-foreground ${
                    isActive("/dashboard") ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className={`transition-colors hover:text-foreground ${
                    isActive("/profile") ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  Profile
                </Link>
                <button
                  onClick={signOut}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className={`transition-colors hover:text-foreground ${
                  isActive("/auth") ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                Login
              </Link>
            )}
            <MoodSelector mood={mood} setMood={setMood} />
            <button
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground font-body">
        <p>一日一歩 — One step each day</p>
      </footer>

      {/* Global floating timer - persists across routes */}
      {showFloatingTimer && (
        <FloatingTimer
          cooldown={timer.mode === "timer" ? timer.remaining : 0}
          mode={timer.mode}
          elapsed={timer.elapsed}
          phase={timer.phase}
          isRunning={timer.isRunning}
        />
      )}

      <SpotifyMiniPlayer />
      <TodoPanel />
    </div>
  );
}
