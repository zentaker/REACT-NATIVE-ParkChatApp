import type { Session, User } from "@supabase/supabase-js";
import { createContext, type PropsWithChildren, useEffect, useMemo, useState } from "react";

import { isMockAuthMode, getSession, onAuthStateChange } from "../services/auth";

export type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isMockMode: boolean;
};

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isMockMode = isMockAuthMode();

  useEffect(() => {
    let isMounted = true;

    getSession()
      .then((nextSession) => {
        if (isMounted) {
          setSession(nextSession);
        }
      })
      .catch((error) => {
        console.warn("Could not load auth session:", error instanceof Error ? error.message : error);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    const unsubscribe = onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isAuthenticated: isMockMode || Boolean(session?.user),
      isMockMode
    }),
    [isMockMode, loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
