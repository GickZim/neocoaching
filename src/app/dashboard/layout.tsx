"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUserRole } from "@/lib/auth";
import {
  LayoutDashboard,
  ClipboardCheck,
  Camera,
  History,
  Dumbbell,
  Utensils,
  LogOut,
  Menu,
  Loader2,
  UserCircle,
  TrendingDown,
  Calculator,
  Flame,
  X,
} from "lucide-react";
import { ToastProvider } from "@/components/ui/toast";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/checkins", icon: ClipboardCheck, label: "Check-ins" },
  {
    href: "/dashboard/weight-trend",
    icon: TrendingDown,
    label: "Weight Trend",
  },
  { href: "/dashboard/progress", icon: Camera, label: "Progress Photos" },
  {
    href: "/dashboard/progress-history",
    icon: History,
    label: "Progress History",
  },
  { href: "/dashboard/workouts", icon: Dumbbell, label: "Workouts" },
  { href: "/dashboard/mealplans", icon: Utensils, label: "Meal Plans" },
  { href: "/dashboard/bmi", icon: Calculator, label: "BMI Calculator" },
  { href: "/dashboard/tracker", icon: Flame, label: "Daily Tracker" },
  { href: "/dashboard/profile", icon: UserCircle, label: "My Profile" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [clientName, setClientName] = useState("");
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const role = await getCurrentUserRole();
      if (role !== "client") {
        router.replace("/coach");
        return;
      }

      // Load name + streak + expiry in parallel
      const [profileRes, trackingRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, access_expires_at")
          .eq("id", user.id)
          .single(),
        supabase
          .from("daily_tracking")
          .select("workout_completed,meal_plan_followed,tracking_date")
          .eq("user_id", user.id)
          .order("tracking_date", { ascending: false })
          .limit(30),
      ]);

      if (profileRes.data) {
        setClientName(profileRes.data.full_name || "");

        // Expiry check — coach hasn't set a date = no restriction
        const expiresAt = profileRes.data.access_expires_at;
        if (expiresAt && new Date(expiresAt) < new Date()) {
          router.replace("/account-expired");
          return;
        }
      }

      if (trackingRes.data) {
        let s = 0;
        for (const d of trackingRes.data) {
          if (d.workout_completed || d.meal_plan_followed) s++;
          else break;
        }
        setStreak(s);
      }

      setChecking(false);
    }
    checkAccess();
  }, [router]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37] mx-auto" />
          <p className="text-white/30 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const initials = clientName
    ? clientName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 h-[68px] border-b border-white/5 bg-black/95 backdrop-blur-xl z-50">
        <div className="h-full px-4 md:px-6 flex items-center justify-between">
          {/* Left: hamburger + brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/images/logo1.png"
                alt="NeoCoaching"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <div className="hidden sm:block">
                <p className="font-black text-base leading-tight">
                  <span className="text-[#D4AF37]">Neo</span>Coaching
                </p>
                <p className="text-[10px] text-white/30 leading-tight tracking-wider uppercase">
                  Client Portal
                </p>
              </div>
            </Link>
          </div>

          {/* Right: streak + avatar */}
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="streak-badge hidden sm:inline-flex">
                <Flame size={13} />
                {streak} day streak
              </div>
            )}
            <div className="w-9 h-9 rounded-full gold-gradient-bg flex items-center justify-center font-black text-black text-sm">
              {initials}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-[68px] h-[calc(100vh-68px)] w-64 border-r border-white/5 bg-[#050505] z-50 flex flex-col transform transition-transform duration-300 md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Mobile close */}
          <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-white/5">
            <span className="text-sm font-semibold text-white/50 uppercase tracking-wider">
              Menu
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/15"
                      : "text-white/45 hover:text-white hover:bg-white/4"
                  }`}
                >
                  <Icon size={16} className={active ? "text-[#D4AF37]" : ""} />
                  {label}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User + logout */}
          <div className="px-3 py-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
              <div className="w-8 h-8 rounded-full gold-gradient-bg flex items-center justify-center font-black text-black text-xs shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {clientName || "Client"}
                </p>
                <p className="text-xs text-white/30">Active Client</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all duration-200"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="w-full md:ml-64 pt-[68px] min-h-screen">
          <div className="px-4 md:px-8 py-8">{children}</div>
        </main>
      </div>

      <ToastProvider />
    </div>
  );
}
