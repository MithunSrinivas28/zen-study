import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Moon, Sun, Focus } from "lucide-react";
import { useEffect, useState, createContext, useContext } from "react";
import SpotifyMiniPlayer from "@/components/SpotifyMiniPlayer";

export const FocusModeContext = createContext<{ focusMode: boolean; toggleFocus: () => void }>({
  focusMode: false,
  toggleFocus: () => {},
});

export function useFocusMode() {
  return useContext(FocusModeContext);
}

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
  const [focusMode, setFocusMode] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isDashboard = location.pathname === "/dashboard";

  return (
    <FocusModeContext.Provider value={{ focusMode, toggleFocus: () => setFocusMode((f) => !f) }}>
      <div className="min-h-screen flex flex-col bg-background">
        {!focusMode && (
          <header className="border-b border-border transition-all duration-300">
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
                {isDashboard && (
                  <button
                    onClick={() => setFocusMode(true)}
                    aria-label="Enter focus mode"
                    title="Focus mode"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Focus className="h-4 w-4" />
                  </button>
                )}
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
        )}

        {focusMode && (
          <div className="flex justify-end px-4 py-2">
            <button
              onClick={() => setFocusMode(false)}
              className="text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
            >
              Exit Focus Mode
            </button>
          </div>
        )}

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1000px] my-6 px-4 lg:px-0">
            <div className="bg-[hsl(var(--canvas))] border border-[hsl(var(--canvas-border))] rounded-[20px] shadow-[var(--canvas-shadow)] p-6 sm:p-10">
              {children}
            </div>
          </div>
        </main>

        {!focusMode && (
          <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground font-body">
            <p>一日一歩 — One step each day</p>
          </footer>
        )}
        <SpotifyMiniPlayer />
      </div>
    </FocusModeContext.Provider>
  );
}
