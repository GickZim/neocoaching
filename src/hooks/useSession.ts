"use client";

/**
 * useSession
 *
 * A single, app-wide session hook that resolves the Supabase auth session
 * exactly ONCE per page load, then keeps it live via onAuthStateChange.
 *
 * Fixes report section 1.2 — supabase.auth.getUser() was being called
 * 3-6× per page load across separate useEffect blocks. Every call makes
 * a network round-trip to the Supabase GoTrue server. This hook collapses
 * all of those into one, shared subscription.
 *
 * Usage:
 *   const { user, session, loading } = useSession();
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export interface SessionState {
  session: Session | null;
  user: User | null;
  /** True only during the initial resolution — false once we know the state. */
  loading: boolean;
}

export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // getSession() reads from localStorage — it does NOT make a network call.
    // It is safe to call frequently; we use it here for the initial state.
    // (getUser() makes a network call to revalidate — that is what we're
    //  avoiding duplicating. The middleware / requireCoach() on the server
    //  does the real validation; client-side we just need to know "is there
    //  a session at all" to decide what to render.)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // onAuthStateChange fires synchronously with the cached session on mount
    // (INITIAL_SESSION event), then again on any sign-in/sign-out/token-refresh.
    // This keeps all consumers up-to-date without any polling.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
  };
}
