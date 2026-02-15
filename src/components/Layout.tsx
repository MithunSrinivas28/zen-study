import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import bgLandscape from "@/assets/bg-landscape.jpg";

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

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen relative">
      {/* Fixed background image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-20"
        style={{ backgroundImage: `url(${bgLandscape})` }}
      />
      {/* Overlay to soften background */}
      <div className="fixed inset-0 -z-10 bg-[hsl(var(--overlay-bg))] backdrop-blur-sm" />

      {/* Floating content panel */}
      <div className="min-h-screen flex flex-col mx-auto w-full lg:w-[70%] xl:w-[65%] 2xl:w-[60%] lg:my-0 bg-[hsl(var(--panel-bg))] lg:backdrop-blur-md lg:border-x border-border lg:shadow-xl transition-colors duration-300">
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
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground font-body">
          <p>一日一歩 — One step each day</p>
        </footer>
      </div>
    </div>
  );
}
