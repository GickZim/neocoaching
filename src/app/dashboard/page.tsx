"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getCurrentUserRole } from "@/lib/auth";
import {
  Weight,
  Camera,
  CalendarCheck,
  Flame,
  Trophy,
  Target,
  ArrowRight,
  CheckCircle,
  TrendingDown,
  Dumbbell,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── Badge definitions ────────────────────────────────────────────────────────
const BADGES = [
  { id: "first_checkin",  icon: "🎯", label: "First Check-in",  desc: "You showed up." },
  { id: "week_streak",    icon: "🔥", label: "7-Day Streak",     desc: "One week consistent." },
  { id: "photo_upload",   icon: "📸", label: "Photo Progress",   desc: "Tracking your journey." },
  { id: "month_member",   icon: "🏆", label: "30-Day Member",    desc: "One month strong." },
];

function Badge({ icon, label, desc, earned }: { icon: string; label: string; desc: string; earned: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all ${
      earned
        ? "bg-[#D4AF37]/8 border-[#D4AF37]/20"
        : "bg-white/2 border-white/5 opacity-35 grayscale"
    }`}>
      <span className="text-2xl leading-none">{icon}</span>
      <span className={`text-xs font-semibold leading-tight ${earned ? "text-white" : "text-white/50"}`}>{label}</span>
      <span className="text-[10px] text-white/30 leading-tight hidden sm:block">{desc}</span>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  href?: string;
}) {
  const inner = (
    <div className={`relative rounded-2xl p-5 border transition-all duration-300 h-full group ${
      accent
        ? "bg-gradient-to-br from-[#1a1200] to-[#0a0a0a] border-[#D4AF37]/25 hover:border-[#D4AF37]/40 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
        : "bg-[#0a0a0a] border-white/6 hover:border-white/12"
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
        accent ? "gold-gradient-bg" : "bg-white/5"
      }`}>
        <div className={accent ? "text-black" : "text-[#D4AF37]"}>{icon}</div>
      </div>
      <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-black leading-none mb-1 ${accent ? "text-[#D4AF37]" : "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-white/30 text-xs">{sub}</p>}
      {href && (
        <ArrowRight
          size={14}
          className="absolute top-4 right-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-1 transition-all"
        />
      )}
    </div>
  );

  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName]   = useState("");
  const [weight, setWeight]           = useState("--");
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [startWeight, setStartWeight]   = useState<number | null>(null);
  const [photoCount, setPhotoCount]   = useState(0);
  const [latestWeek, setLatestWeek]   = useState(0);
  const [checkinDone, setCheckinDone] = useState(false);
  const [streak, setStreak]           = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
  const [checkinCount, setCheckinCount] = useState(0);

  useEffect(() => {
    async function checkAccess() {
      const role = await getCurrentUserRole();
      if (role !== "client") { router.push("/coach"); return; }
    }
    checkAccess();
  }, [router]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Batch all queries in parallel
      const [profileRes, photosRes, checkinRes, allCheckinsRes, trackingRes] = await Promise.all([
        supabase.from("profiles").select("full_name,current_weight,target_weight").eq("id", user.id).single(),
        supabase.from("progress_photos").select("id").eq("user_id", user.id),
        supabase.from("checkins").select("weight,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("checkins").select("id,created_at").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("daily_tracking").select("workout_completed,meal_plan_followed,tracking_date").eq("user_id", user.id).order("tracking_date", { ascending: false }).limit(30),
      ]);

      // Profile
      if (profileRes.data) {
        setClientName(profileRes.data.full_name || "");
        if (profileRes.data.target_weight) setTargetWeight(profileRes.data.target_weight);
        if (profileRes.data.current_weight) setStartWeight(profileRes.data.current_weight);
      }

      // Photos
      const pc = photosRes.data?.length ?? 0;
      setPhotoCount(pc);
      setLatestWeek(pc);

      // Latest check-in
      if (checkinRes.data) {
        setWeight(checkinRes.data.weight?.toString() ?? "--");
        setCheckinDone(true);
      }

      // All check-ins count
      const allCI = allCheckinsRes.data ?? [];
      setCheckinCount(allCI.length);

      // Streak
      let s = 0;
      if (trackingRes.data) {
        for (const d of trackingRes.data) {
          if (d.workout_completed || d.meal_plan_followed) s++;
          else break;
        }
        setStreak(s);
      }

      // Badges
      const earned = new Set<string>();
      if (allCI.length >= 1) earned.add("first_checkin");
      if (s >= 7) earned.add("week_streak");
      if (pc >= 1) earned.add("photo_upload");
      if (allCI.length > 0) {
        const firstDate = new Date(allCI[0].created_at);
        const daysSince = Math.floor((Date.now() - firstDate.getTime()) / 86400000);
        if (daysSince >= 30) earned.add("month_member");
      }
      setEarnedBadges(earned);

      setLoading(false);
    }
    load();
  }, []);

  // Goal progress calculation
  let goalProgress = 0;
  if (startWeight && targetWeight) {
    const latestW = parseFloat(weight);
    if (!isNaN(latestW)) {
      const totalToLose = startWeight - targetWeight;
      const lost = startWeight - latestW;
      goalProgress = totalToLose > 0 ? Math.min(100, Math.max(0, Math.round((lost / totalToLose) * 100))) : 0;
    }
  }

  const firstName = clientName.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/35 text-sm font-medium mb-1">{greeting},</p>
            <h1 className="text-3xl sm:text-4xl font-black">
              {firstName}{" "}
              <span className="text-2xl sm:text-3xl">👋</span>
            </h1>
            <p className="text-white/40 mt-2 text-sm">
              Stay consistent. Track progress. Transform your physique.
            </p>
          </div>
          {streak > 0 && (
            <div className="streak-badge shrink-0 mt-1">
              <Flame size={14} />
              {streak} day{streak !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Goal Progress ── */}
      {targetWeight && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#0a0a0a] border border-[#D4AF37]/15 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#D4AF37]" />
              <span className="text-sm font-semibold text-white">Goal Progress</span>
            </div>
            <span className="text-[#D4AF37] font-black text-sm">{goalProgress}%</span>
          </div>
          <div className="progress-bar-track">
            <motion.div
              className="progress-bar-fill"
              initial={{ width: "0%" }}
              animate={{ width: `${goalProgress}%` }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/30">
            <span>Start: {startWeight} kg</span>
            <span>Target: {targetWeight} kg</span>
          </div>
        </motion.div>
      )}

      {/* ── Stat Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <StatCard
          icon={<Weight size={18} />}
          label="Current Weight"
          value={`${weight} kg`}
          sub="Latest check-in"
          accent
          href="/dashboard/checkins"
        />
        <StatCard
          icon={<Camera size={18} />}
          label="Progress Photos"
          value={`${photoCount}`}
          sub="Total uploads"
          href="/dashboard/progress"
        />
        <StatCard
          icon={<CalendarCheck size={18} />}
          label="Check-ins"
          value={`${checkinCount}`}
          sub={checkinDone ? "Latest: completed ✓" : "Submit this week's"}
          href="/dashboard/checkins"
        />
      </motion.div>

      {/* ── Achievements ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={16} className="text-[#D4AF37]" />
          <h2 className="text-sm font-semibold text-white">Achievements</h2>
          <span className="ml-auto text-xs text-white/25">
            {earnedBadges.size}/{BADGES.length} earned
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BADGES.map((b) => (
            <Badge key={b.id} {...b} earned={earnedBadges.has(b.id)} />
          ))}
        </div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5"
      >
        <h2 className="text-sm font-semibold text-white mb-1">Weekly Tasks</h2>
        <p className="text-white/30 text-xs mb-4">Complete these every week to stay on track.</p>

        <div className="space-y-2">
          {[
            { label: "Submit weekly check-in",  href: "/dashboard/checkins",  done: checkinDone,   icon: <ClipboardCheckIcon /> },
            { label: "Upload progress photos",  href: "/dashboard/progress",   done: photoCount > 0, icon: <Camera size={15} /> },
            { label: "Log today in tracker",    href: "/dashboard/tracker",    done: streak > 0,    icon: <Flame size={15} /> },
          ].map(({ label, href, done, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 group ${
                done
                  ? "bg-green-500/5 border-green-500/15 text-green-400/70"
                  : "bg-white/2 border-white/6 text-white/60 hover:text-white hover:border-white/12"
              }`}
            >
              <div className={`shrink-0 ${done ? "text-green-400" : "text-[#D4AF37]"}`}>
                {done ? <CheckCircle size={15} /> : icon}
              </div>
              <span className="text-sm font-medium flex-1">{label}</span>
              <ArrowRight size={13} className="text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Quick Nav ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        {[
          { label: "View Workouts",   href: "/dashboard/workouts",     icon: <Dumbbell size={16} /> },
          { label: "Weight Trend",    href: "/dashboard/weight-trend",  icon: <TrendingDown size={16} /> },
          { label: "View Meal Plans", href: "/dashboard/mealplans",     icon: <Utensils size={16} /> },
        ].map(({ label, href, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 hover:bg-white/4 text-white/50 hover:text-white text-sm font-medium transition-all duration-200 group"
          >
            <span className="text-[#D4AF37]">{icon}</span>
            {label}
            <ArrowRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

// Inline icon alias to avoid import collision
function ClipboardCheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M12 11v6M9 14l3 3 3-3" />
      <path d="M5 4h2a1 1 0 0 1 1 1v2M17 4h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2" />
    </svg>
  );
}

// Missing import alias
function Utensils(props: { size: number }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  );
}
