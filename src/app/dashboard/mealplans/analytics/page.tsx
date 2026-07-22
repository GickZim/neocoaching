"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Flame, TrendingUp, Loader2, CalendarX } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function NutritionAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<{ day: string; compliance: number }[]>([]);
  const [avgCompliance, setAvgCompliance] = useState(0);
  const [streak, setStreak] = useState(0);
  const [missedMeals, setMissedMeals] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const since = new Date(); since.setDate(since.getDate() - 28);
      const { data: logs } = await supabase.from("meal_logs").select("logged_date, completed")
        .eq("user_id", user.id).gte("logged_date", since.toISOString().split("T")[0])
        .order("logged_date", { ascending: true });

      if (logs?.length) {
        // Group by week
        const byDay = new Map<string, { total: number; done: number }>();
        logs.forEach(l => {
          const existing = byDay.get(l.logged_date) ?? { total: 0, done: 0 };
          existing.total++;
          if (l.completed) existing.done++;
          byDay.set(l.logged_date, existing);
        });

        const days = Array.from(byDay.entries()).slice(-14).map(([date, v]) => ({
          day: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          compliance: Math.round((v.done / v.total) * 100),
        }));
        setWeeklyData(days);

        const totalDone = logs.filter(l => l.completed).length;
        setAvgCompliance(Math.round((totalDone / logs.length) * 100));
        setMissedMeals(logs.filter(l => !l.completed).length);

        // Streak: consecutive days with 100% compliance, most recent first
        const dayEntries = Array.from(byDay.entries()).reverse();
        let s = 0;
        for (const [, v] of dayEntries) {
          if (v.done === v.total) s++; else break;
        }
        setStreak(s);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-[#D4AF37]" size={28} /></div>;

  return (
    <div className="pb-12">
      <Link href="/dashboard/mealplans" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition">
        <ArrowLeft size={14} /> Back to Meal Plans
      </Link>

      <p className="section-label mb-2">Nutrition</p>
      <h1 className="text-3xl font-black mb-1">Nutrition Analytics</h1>
      <p className="text-white/35 text-sm mb-8">Your meal compliance over the last 4 weeks.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5">
          <TrendingUp size={16} className="text-[#D4AF37] mb-2" />
          <p className="text-2xl font-black">{avgCompliance}%</p>
          <p className="text-white/30 text-xs mt-1">Avg Compliance</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5">
          <Flame size={16} className="text-[#D4AF37] mb-2" />
          <p className="text-2xl font-black">{streak}</p>
          <p className="text-white/30 text-xs mt-1">Day Streak</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5">
          <CalendarX size={16} className="text-red-400 mb-2" />
          <p className="text-2xl font-black">{missedMeals}</p>
          <p className="text-white/30 text-xs mt-1">Missed Meals</p>
        </div>
      </div>

      {weeklyData.length > 0 ? (
        <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-6">
          <h2 className="font-bold text-base mb-4">Daily Compliance Trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", fontSize: 13 }} cursor={{ fill: "rgba(212,175,55,0.05)" }} />
              <Bar dataKey="compliance" fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-16 text-center">
          <Flame size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Start logging your meals to see analytics here.</p>
        </div>
      )}
    </div>
  );
}
