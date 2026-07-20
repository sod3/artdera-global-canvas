import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthService, MarketplaceService } from "./services";
import type { User } from "./types";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const refresh = async () => {
    const next = await AuthService.currentUser();
    setUser(next);
  };

  useEffect(() => {
    let active = true;
    MarketplaceService.initialize()
      .then((next) => {
        if (!active) return;
        setUser(next);
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        setError("ArtDera could not connect to its secure data service.");
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      refresh,
      logout: async () => {
        setUser(null);
        await AuthService.logout();
      },
    }),
    [ready, user],
  );

  if (!ready)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ivory)] px-5">
        <div className="text-center">
          <div className="eyebrow">ArtDera</div>
          <div className="mt-4 h-1 w-40 animate-pulse rounded-full bg-[var(--oxblood)]/30" />
          <p className="mt-4 text-sm text-muted-foreground">Loading the marketplace…</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ivory)] px-5">
        <div className="max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-8 text-center">
          <div className="eyebrow">Secure service unavailable</div>
          <h1 className="mt-3 font-display text-4xl">ArtDera is not ready yet.</h1>
          <p className="mt-3 text-sm text-muted-foreground">{error} Check the API and MongoDB configuration, then reload.</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-6">Try again</button>
        </div>
      </div>
    );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The provider and hook intentionally share one module so the authentication
// adapter can be replaced without changing consumers.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
