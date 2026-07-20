import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthService } from "./services";
import type { User } from "./types";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  refresh: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const refresh = () => setUser(AuthService.currentUser());

  useEffect(() => {
    refresh();
    setReady(true);
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      refresh,
      logout: () => {
        AuthService.logout();
        setUser(null);
      },
    }),
    [ready, user],
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
