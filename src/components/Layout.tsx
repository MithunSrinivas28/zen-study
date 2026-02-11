import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between max-w-4xl">
          <Link to="/" className="font-serif text-2xl font-bold tracking-tight text-foreground">
            習慣 <span className="text-sm font-body font-normal text-muted-foreground ml-1">Shūkan</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-body">
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
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground font-body">
        <p>一日一歩 — One step each day</p>
      </footer>
    </div>
  );
}
