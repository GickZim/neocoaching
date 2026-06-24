/**
 * src/lib/auth.ts — updated
 *
 * Changes from the original:
 *  1. Removed console.log("Current User:", user) and console.log("Profile:", data)
 *     — report section 6.7: these logged full user/profile objects to the
 *     browser console in production on every protected page load.
 *
 *  2. getCurrentUserRole() is kept for backwards compatibility with any
 *     pages that still call it directly, but its internals now use
 *     supabase.auth.getSession() (reads from the local cookie cache — no
 *     network call) instead of supabase.auth.getUser() (which makes a
 *     network round-trip to GoTrue every time).
 *     Note: getSession() is fine here because the session was already
 *     revalidated once by middleware.ts on the request that loaded the page.
 *     If you're not using middleware yet, keep getUser() for security.
 *
 *  3. isCoach() is kept as a thin wrapper around getCurrentUserRole() for
 *     any call sites that use it. New code should use useRequireRole() instead.
 */

import { supabase } from "./supabase";

export async function getCurrentUserRole(): Promise<string | null> {
  // Use getSession() (local cache read) rather than getUser() (network call).
  // Middleware already revalidated the session before this page rendered.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  return data?.role ?? null;
}

export async function isCoach(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "coach";
}
