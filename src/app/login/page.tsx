"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { showToast } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.toLowerCase().includes("invalid")) {
          showToast("Incorrect email or password. Please try again.", "error");
        } else {
          showToast(error.message, "error");
        }
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { showToast("Could not retrieve user. Please try again.", "error"); return; }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileErr) { showToast("Could not load profile. Please try again.", "error"); return; }

      showToast("Welcome back! Redirecting…", "gold");

      setTimeout(() => {
        router.push(profile?.role === "coach" ? "/coach" : "/dashboard");
      }, 600);
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex">
      {/* ── Left panel: brand imagery (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="/images/neo-hero.jpg"
          alt="NeoCoaching"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        {/* Brand content over image */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/images/logo1.png" alt="NeoCoaching" width={42} height={42} className="rounded-lg" />
            <span className="font-black text-xl">
              <span className="text-[#D4AF37]">Neo</span>Coaching
            </span>
          </Link>

          <div>
            <blockquote className="text-3xl font-black leading-tight mb-4">
              "Consistency beats{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F5D97A)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                perfection.
              </span>
            </blockquote>
            <p className="text-white/50 text-sm">— Coach Neo</p>
          </div>
        </div>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/images/logo1.png" alt="NeoCoaching" width={36} height={36} className="rounded-lg" />
              <span className="font-black text-lg">
                <span className="text-[#D4AF37]">Neo</span>Coaching
              </span>
            </Link>
          </div>

          {/* Back link */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={14} />
            Back to site
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-black mb-2">Client Login</h1>
            <p className="text-white/40 text-sm">
              Access your personal coaching dashboard.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="you@example.com"
                className={`field-premium ${errors.email ? "border-red-500/50" : ""}`}
                autoComplete="email"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className={`field-premium pr-12 ${errors.password ? "border-red-500/50" : ""}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn-gold w-full flex items-center justify-center gap-2 mt-2 py-4 text-base"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Signing in…</>
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          {/* Help text */}
          <div className="mt-6 p-4 rounded-xl bg-white/3 border border-white/6">
            <p className="text-white/40 text-sm text-center leading-relaxed">
              Don't have an account yet?{" "}
              <Link href="/apply" className="text-[#D4AF37] hover:text-[#F5D97A] font-semibold transition-colors">
                Apply for coaching
              </Link>{" "}
              and your coach will set you up.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
