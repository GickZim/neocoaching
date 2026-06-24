"use client";

/**
 * useRequireRole
 *
 * Consolidates the duplicated auth-guard pattern that currently appears
 * identically in four separate files:
 *   - src/app/coach/layout.tsx
 *   - src/app/coach/page.tsx
 *   - src/app/dashboard/layout.tsx
 *   - src/app/dashboard/page.tsx
 *
 * Each of those files independently called supabase.auth.getUser() and
 * then getCurrentUserRole() (which calls getUser() again internally) —
 * resulting in 2-4 redundant network round-trips on every page load.
 *
 * Fixes report sections 1.2 (redundant getUser calls) and 8.1 (duplicated
 * auth-guard logic). Also fixes 4.6 (wrong redirect target "/client"
 * in coach/layout.tsx → corrected to "/dashboard" here).
 *
 * Usage:
 *   const { checking } = useRequireRole("coach");   // in coach/layout.tsx
 *   const { checking } = useRequireRole("client");  // in dashboard/layout.tsx
 *
 * While checking === true, render a loading spinner.
 * Once false, the user is confirmed to have the required role.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./useSession";
import { supabase } from "@/lib/supabase";

type Role = "coach" | "client";

interface RequireRoleState {
  /** True while the session + role are still being verified. */
  checking: boolean;
}

export function useRequireRole(requiredRole: Role): RequireRoleState {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Don't act until useSession has resolved.
    if (sessionLoading) return;

    // No session at all — send to login.
    if (!user) {
      router.replace("/login");
      return;
    }

    // Session exists — verify the role against the profiles table.
    // This is one query, shared by both portals, replacing the duplicated
    // getCurrentUserRole() + getUser() waterfall in each layout.
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          // Can't determine role — treat as logged-out.
          router.replace("/login");
          return;
        }

        if (data.role !== requiredRole) {
          // Wrong role — redirect to the correct portal.
          // Fixes report section 4.6: coach/layout.tsx was redirecting
          // to "/client" (a 404) instead of "/dashboard".
          if (data.role === "coach") {
            router.replace("/coach");
          } else {
            router.replace("/dashboard");
          }
          return;
        }

        // Correct role confirmed.
        setChecking(false);
      });
  }, [user, sessionLoading, requiredRole, router]);

  return { checking };
}
