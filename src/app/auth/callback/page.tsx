"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { Loader2, XCircle } from "lucide-react";

/**
 * /auth/callback
 *
 * Supabase redirects here after a user clicks an invite/magic link.
 * The URL looks like:
 *   /auth/callback#access_token=...&refresh_token=...&type=invite
 *
 * We read the tokens from the URL hash, call setSession() to log the
 * user in, then redirect them:
 *   - type=invite  → /dashboard/profile (so they can set their password immediately)
 *   - type=recovery → /dashboard/profile (password reset flow)
 *   - anything else → /dashboard
 *
 * This page is set as the redirectTo in approve/route.ts.
 */

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      try {
        const hash = window.location.hash;

        // No hash at all — shouldn't happen, send to login
        if (!hash || hash === "#") {
          router.replace("/login");
          return;
        }

        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const type = params.get("type"); // "invite", "recovery", "signup", etc.

        if (!access_token || !refresh_token) {
          setError(
            "Invalid invite link. Please ask your coach to resend the invite.",
          );
          return;
        }

        // Exchange the tokens for a real session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          console.error("Session error:", sessionError);
          // Common cause: link already used or expired (Supabase invite links
          // are single-use and expire after 24h by default)
          if (
            sessionError.message?.toLowerCase().includes("expired") ||
            sessionError.message?.toLowerCase().includes("already")
          ) {
            setError(
              "This invite link has already been used or has expired. Please ask your coach to resend your invite.",
            );
          } else {
            setError(
              "Something went wrong. Please try again or contact your coach.",
            );
          }
          return;
        }

        // Redirect based on link type:
        // - invite  → profile page so they set a password straight away
        // - recovery → profile page (password reset)
        // - anything else → dashboard
        if (type === "invite" || type === "recovery") {
          // Use window.location so the page fully reloads with the new session
          // cookie in place (router.replace can race with cookie setting)
          window.location.href = "/dashboard/profile?tab=password&welcome=1";
        } else {
          window.location.href = "/dashboard";
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Something went wrong. Please contact your coach.");
      }
    }

    handleAuth();
  }, [router]);

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <Image
            src="/images/logo1.png"
            alt="NeoCoaching"
            width={80}
            height={80}
            className="mx-auto mb-6 rounded-xl"
          />
          <div className="bg-zinc-950 border border-red-500/30 rounded-3xl p-8">
            <XCircle size={40} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-3">
              Link expired or already used
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              {error}
            </p>
            <a
              href="/login"
              className="inline-block bg-[#D4AF37] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#c4a030] transition"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
      <Image
        src="/images/logo1.png"
        alt="NeoCoaching"
        width={80}
        height={80}
        className="rounded-xl opacity-90"
      />
      <div className="flex items-center gap-3 text-zinc-400">
        <Loader2 size={20} className="animate-spin text-[#D4AF37]" />
        <span className="text-sm">Logging you in...</span>
      </div>
    </div>
  );
}
