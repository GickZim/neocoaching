"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Users, ClipboardCheck, Camera, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Flame, Loader2, ChevronRight,
  Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

type ClientRow = {
  id: string; full_name: string; email: string;
  current_weight: number | null; target_weight: number | null;
  goal: string | null; created_at: string;
};
type CheckinRow = {
  id: string; user_id: string; weight: number | null;
  energy_level: number | null; sleep_quality: number | null;
  workout_adherence: number | null; created_at: string;
};
type TrackingRow = {
  user_id: string; tracking_date: string;
  workout_completed: boolean; meal_plan_followed: boolean;
};
type ClientStat = {
  client: ClientRow; lastCheckin: string | null; daysSince: number | null;
  checkinCount: number; avgEnergy: number | null; avgSleep: number | null;
  workoutRate: number | null; mealRate: number | null;
  weightChange: number | null; isAtRisk: boolean;
};

function daysSinceDate(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function KpiCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 border transition-all duration-300 ${
      accent
        ? "bg-gradient-to-br from-[#1a1200] to-[#0a0a0a] border-[#D4AF37]/25 hover:border-[#D4AF37]/40"
        : "bg-[#0a0a0a] border-white/6 hover:border-white/10"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? "gold-gradient-bg" : "bg-white/5"}`}>
          <div className={accent ? "text-black" : "text-[#D4AF37]"}>{icon}</div>
        </div>
      </div>
      <p className={`text-4xl font-black leading-none ${accent ? "text-[#D4AF37]" : "text-white"}`}>{value}</p>
      {sub && <p className="text-white/30 text-xs mt-2">{sub}</p>}
    </div>
  );
}

function RateBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-white/20 text-sm">—</span>;
  const cls = value >= 70 ? "text-emerald-400" : value >= 40 ? "text-amber-400" : "text-red-400";
  return <span className={`font-bold text-sm ${cls}`}>{value}%</span>;
}

function LastCheckinBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-white/25 text-xs">Never</span>;
  if (days <= 7)  return <span className="text-emerald-400 text-xs font-medium">{days}d ago</span>;
  if (days <= 14) return <span className="text-amber-400 text-xs font-medium">{days}d ago</span>;
  return <span className="text-red-400 text-xs font-semibold">{days}d ago 🚨</span>;
}

export default function CoachDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [tracking, setTracking] = useState<TrackingRow[]>([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "clients" | "risk">("overview");

  useEffect(() => {
    async function load() {
      const [{ data: cd }, { data: ci }, { data: td }, { count: photos }] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "client").order("full_name"),
        supabase.from("checkins").select("id,user_id,weight,energy_level,sleep_quality,workout_adherence,created_at").order("created_at", { ascending: true }),
        supabase.from("daily_tracking").select("user_id,tracking_date,workout_completed,meal_plan_followed")
          .gte("tracking_date", new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]),
        supabase.from("progress_photos").select("*", { count: "exact", head: true }),
      ]);
      setClients(cd ?? []);
      setCheckins(ci ?? []);
      setTracking(td ?? []);
      setPhotoCount(photos ?? 0);
      setLoading(false);
    }
    load();
  }, []);

  const clientStats: ClientStat[] = clients.map((client) => {
    const cc = checkins.filter((c) => c.user_id === client.id);
    const tc = tracking.filter((t) => t.user_id === client.id);
    const lastCheckin = cc.length ? cc[cc.length - 1].created_at : null;
    const daysSince = lastCheckin ? daysSinceDate(lastCheckin) : null;
    const weights = cc.map((c) => c.weight).filter(Boolean) as number[];
    const weightChange = weights.length >= 2
      ? parseFloat((weights[weights.length - 1] - weights[0]).toFixed(1))
      : null;
    const avgEnergy = cc.length ? Math.round(cc.reduce((s, c) => s + (c.energy_level ?? 0), 0) / cc.length) : null;
    const avgSleep  = cc.length ? Math.round(cc.reduce((s, c) => s + (c.sleep_quality ?? 0), 0) / cc.length) : null;
    const workoutRate = tc.length ? Math.round(tc.filter((t) => t.workout_completed).length / tc.length * 100) : null;
    const mealRate    = tc.length ? Math.round(tc.filter((t) => t.meal_plan_followed).length / tc.length * 100) : null;
    return { client, lastCheckin, daysSince, checkinCount: cc.length, avgEnergy, avgSleep, workoutRate, mealRate, weightChange, isAtRisk: daysSince === null || daysSince > 10 };
  });

  const atRiskClients = clientStats.filter((s) => s.isAtRisk);
  const activeClients = clientStats.filter((s) => !s.isAtRisk);

  const weeklyCheckins = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(); start.setDate(start.getDate() - (8 - i) * 7);
    const end   = new Date(); end.setDate(end.getDate()   - (7 - i) * 7);
    return { week: `W${i + 1}`, count: checkins.filter((c) => { const d = new Date(c.created_at); return d >= start && d < end; }).length };
  });

  const avgWorkout = clientStats.filter((s) => s.workoutRate !== null).length
    ? Math.round(clientStats.filter((s) => s.workoutRate !== null).reduce((s, c) => s + (c.workoutRate ?? 0), 0) / clientStats.filter((s) => s.workoutRate !== null).length)
    : null;
  const avgMeal = clientStats.filter((s) => s.mealRate !== null).length
    ? Math.round(clientStats.filter((s) => s.mealRate !== null).reduce((s, c) => s + (c.mealRate ?? 0), 0) / clientStats.filter((s) => s.mealRate !== null).length)
    : null;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-10 w-72 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="section-label mb-2">Coach Portal</p>
            <h1 className="text-3xl font-black">Welcome back, Coach 👋</h1>
            <p className="text-white/35 mt-1 text-sm">Here's what's happening across your roster.</p>
          </div>
          {atRiskClients.length > 0 && (
            <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/20 text-red-400 text-sm font-semibold px-4 py-2.5 rounded-xl">
              <AlertTriangle size={15} />
              {atRiskClients.length} client{atRiskClients.length !== 1 ? "s" : ""} need attention
            </div>
          )}
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <KpiCard icon={<Users size={16} />} label="Total Clients" value={clients.length}
          sub={`${activeClients.length} active this week`} />
        <KpiCard icon={<ClipboardCheck size={16} />} label="Total Check-ins" value={checkins.length}
          sub={`${checkins.filter((c) => daysSinceDate(c.created_at) <= 7).length} this week`} />
        <KpiCard icon={<Camera size={16} />} label="Progress Photos" value={photoCount} />
        <KpiCard icon={<Flame size={16} />} label="Avg Workout Rate"
          value={avgWorkout !== null ? `${avgWorkout}%` : "—"} sub="Last 30 days" accent />
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 border border-white/5 rounded-xl p-1 w-fit">
        {(["overview", "clients", "risk"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all flex items-center gap-1.5 ${
              activeTab === t ? "bg-[#D4AF37] text-black shadow-sm" : "text-white/45 hover:text-white"
            }`}
          >
            {t === "risk" && atRiskClients.length > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                activeTab === t ? "bg-black text-[#D4AF37]" : "bg-red-500 text-white"
              }`}>{atRiskClients.length}</span>
            )}
            {t === "overview" ? "Overview" : t === "clients" ? "All Clients" : "At Risk"}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-6">
            <h2 className="font-bold text-base mb-0.5">Check-ins per week</h2>
            <p className="text-white/30 text-xs mb-6">Last 8 weeks</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyCheckins} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", fontSize: 13 }}
                  cursor={{ fill: "rgba(212,175,55,0.05)" }} />
                <Bar dataKey="count" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Adherence */}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: "Avg Workout Adherence", value: avgWorkout },
              { label: "Avg Meal Plan Adherence", value: avgMeal },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white/70">{label}</h3>
                  <Activity size={15} className="text-[#D4AF37]" />
                </div>
                <p className="text-4xl font-black mb-3">{value !== null ? `${value}%` : "—"}</p>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${value ?? 0}%` }} />
                </div>
                <p className="text-white/25 text-xs mt-2">Average across all clients, last 30 days</p>
              </div>
            ))}
          </div>

          {/* Top performers */}
          {clientStats.filter((s) => (s.workoutRate ?? 0) >= 70).length > 0 && (
            <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={16} className="text-emerald-400" />
                <h3 className="font-semibold text-sm">Top Performers (70%+ adherence)</h3>
              </div>
              <div className="space-y-2">
                {clientStats.filter((s) => (s.workoutRate ?? 0) >= 70).sort((a, b) => (b.workoutRate ?? 0) - (a.workoutRate ?? 0)).slice(0, 5).map((s) => (
                  <div key={s.client.id} className="flex items-center justify-between py-2.5 border-b border-white/4 last:border-0">
                    <Link href={`/coach/clients/${s.client.id}`} className="font-medium text-sm hover:text-[#D4AF37] transition">{s.client.full_name}</Link>
                    <div className="flex items-center gap-3">
                      <RateBadge value={s.workoutRate} />
                      <ChevronRight size={13} className="text-white/20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ALL CLIENTS ── */}
      {activeTab === "clients" && (
        <div className="space-y-3">
          {clientStats.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-16 text-center">
              <Users size={32} className="text-white/15 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No clients yet. Share your apply link to get started.</p>
            </div>
          ) : clientStats.map((s) => (
            <div key={s.client.id} className="bg-[#0a0a0a] border border-white/6 hover:border-white/10 rounded-2xl p-5 transition-all duration-200">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl gold-gradient-bg flex items-center justify-center text-black font-black text-sm shrink-0">
                    {s.client.full_name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{s.client.full_name}</h3>
                      {s.isAtRisk && <AlertTriangle size={13} className="text-red-400 shrink-0" />}
                    </div>
                    <p className="text-white/30 text-xs truncate">{s.client.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  {[
                    { label: "Last check-in", node: <LastCheckinBadge days={s.daysSince} /> },
                    { label: "Workout",  node: <RateBadge value={s.workoutRate} /> },
                    { label: "Meals",    node: <RateBadge value={s.mealRate} /> },
                    { label: "Wt Δ",     node: s.weightChange !== null
                      ? <span className={`font-bold text-sm flex items-center gap-0.5 ${s.weightChange < 0 ? "text-emerald-400" : "text-white/60"}`}>
                          {s.weightChange < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                          {Math.abs(s.weightChange)}kg
                        </span>
                      : <span className="text-white/20 text-sm">—</span>
                    },
                  ].map(({ label, node }) => (
                    <div key={label}>
                      <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1">{label}</p>
                      {node}
                    </div>
                  ))}
                </div>
                <Link href={`/coach/clients/${s.client.id}`}
                  className="flex items-center gap-1.5 bg-white/4 hover:bg-white/8 border border-white/6 px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0">
                  View <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── AT RISK ── */}
      {activeTab === "risk" && (
        <div className="space-y-4">
          {atRiskClients.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-emerald-500/15 rounded-2xl p-16 text-center">
              <CheckCircle size={36} className="text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-1">All clients are active</h3>
              <p className="text-white/30 text-sm">Every client has checked in within 10 days.</p>
            </div>
          ) : (
            <>
              <div className="bg-red-500/6 border border-red-500/15 rounded-xl p-4 text-sm text-red-300">
                <strong>{atRiskClients.length} client{atRiskClients.length !== 1 ? "s" : ""}</strong> haven't submitted a check-in in over 10 days.
              </div>
              {atRiskClients.sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999)).map((s) => (
                <div key={s.client.id} className="bg-[#0a0a0a] border border-red-500/15 rounded-2xl p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertTriangle size={16} className="text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm">{s.client.full_name}</h3>
                        <p className="text-red-400/70 text-xs">
                          {s.daysSince === null ? "Never checked in" : `Last check-in: ${s.daysSince} days ago`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {s.client.email && (
                        <a href={`mailto:${s.client.email}?subject=Checking in on your progress&body=Hi ${s.client.full_name},%0D%0A%0D%0AI noticed you haven't submitted your weekly check-in recently. How are you getting on?%0D%0A%0D%0ACoach Neo`}
                          className="btn-gold px-4 py-2 text-sm rounded-xl">Email</a>
                      )}
                      <Link href={`/coach/clients/${s.client.id}`}
                        className="px-4 py-2 bg-white/4 border border-white/8 rounded-xl text-sm font-semibold hover:bg-white/8 transition">
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
