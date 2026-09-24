"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  plan: string;
  planExpiresAt: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (callbackUrl?: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
});

// Custom auth provider — fetches the current user from /api/auth/session.
// signIn redirects to our own Google OAuth start route (/api/auth/google).
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback((callbackUrl?: string) => {
    const cb = callbackUrl || "/dashboard";
    window.location.href = `/api/auth/google?callbackUrl=${encodeURIComponent(cb)}`;
  }, []);

  const signOut = useCallback(() => {
    void (async () => {
      try {
        await fetch("/api/auth/signout", { method: "POST" });
      } catch {
        // Ignore — always redirect to the landing page.
      }
      window.location.href = "/";
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}