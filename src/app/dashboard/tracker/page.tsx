"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/toast";
import { motion } from "framer-motion";
import { Flame, Dumbbell, Utensils, Droplets, CheckCircle, Loader2, Save } from "lucide-react";

type TrackingDay = {
  tracking_date: string;
  workout_completed: boolean;
  meal_plan_followed: boolean;
  water_intake: number;
};

function StatPill({ label, value, icon, color = "#D4AF37" }: {
  label: string; value: string | number; icon: React.ReactNode; color?: string;
}) {
  return (
    <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs text-white/35 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function TrackerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [mealPlanFollowed, setMealPlanFollowed] = useState(false);
  const [waterIntake, setWaterIntake] = useState(0);

  const [trackingDays, setTrackingDays] = useState<TrackingDay[]>([]);
  const [workoutRate, setWorkoutRate] = useState(0);
  const [mealRate, setMealRate] = useState(0);
  const [avgWater, setAvgWater] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedDay, setSelectedDay] = useState<TrackingDay | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date().toISOString().split("T")[0];

        const [{ data: history }, { data: todayData }] = await Promise.all([
          supabase.from("daily_tracking").select("*").eq("user_id", user.id)
            .order("tracking_date", { ascending: false }),
          supabase.from("daily_tracking").select("*").eq("user_id", user.id)
            .eq("tracking_date", today).single(),
        ]);

        if (history?.length) {
          setTrackingDays(history);
          const total = history.length;
          setWorkoutRate(Math.round((history.filter((d) => d.workout_completed).length / total) * 100));
          setMealRate(Math.round((history.filter((d) => d.meal_plan_followed).length / total) * 100));
          setAvgWater(Number((history.reduce((s, d) => s + (d.water_intake || 0), 0) / total).toFixed(1)));

          let s = 0;
          for (const d of history) {
            if (d.workout_completed || d.meal_plan_followed) s++;
            else break;
          }
          setStreak(s);
        }

        if (todayData) {
          setWorkoutCompleted(todayData.workout_completed);
          setMealPlanFollowed(todayData.meal_plan_followed);
          setWaterIntake(todayData.water_intake);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveTracker() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const { error } = await supabase.from("daily_tracking").upsert({
      user_id: user.id,
      tracking_date: new Date().toISOString().split("T")[0],
      workout_completed: workoutCompleted,
      meal_plan_followed: mealPlanFollowed,
      water_intake: waterIntake,
    });
    setSaving(false);

    if (error) {
      showToast(error.message || "Failed to save.", "error");
      return;
    }

    showToast("Today's tracker saved! Keep it up. 🔥", "success");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const todayScore = (workoutCompleted ? 50 : 0) + (mealPlanFollowed ? 50 : 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-10 w-48 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 max-w-3xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="section-label mb-2">Daily Habits</p>
        <h1 className="text-3xl font-black mb-1">Daily Tracker</h1>
        <p className="text-white/35 text-sm">Log your habits every day to build your streak and stay accountable.</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <StatPill icon={<Flame size={18} />} label="Day Streak" value={`🔥 ${streak}`} />
        <StatPill icon={<Dumbbell size={18} />} label="Workout Rate" value={`${workoutRate}%`} />
        <StatPill icon={<Utensils size={18} />} label="Meal Rate" value={`${mealRate}%`} color="#a78bfa" />
        <StatPill icon={<Droplets size={18} />} label="Avg Water" value={`${avgWater}L`} color="#38bdf8" />
      </motion.div>

      {/* Today's card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-[#0a0a0a] border border-[#D4AF37]/15 rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Today's Log</h2>
            <p className="text-white/30 text-xs mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-[#D4AF37]">{todayScore}%</p>
            <p className="text-white/25 text-xs">Today's score</p>
          </div>
        </div>

        <div className="divider-gold" />

        {/* Toggle row */}
        {[
          { label: "Workout Completed", desc: "Did you train today?", state: workoutCompleted, toggle: () => setWorkoutCompleted(p => !p), icon: <Dumbbell size={16} />, color: "#D4AF37" },
          { label: "Meal Plan Followed", desc: "Did you stick to your nutrition?", state: mealPlanFollowed, toggle: () => setMealPlanFollowed(p => !p), icon: <Utensils size={16} />, color: "#a78bfa" },
        ].map(({ label, desc, state, toggle, icon, color }) => (
          <div key={label} className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-200 ${
            state ? "bg-white/3 border-white/10" : "bg-[#0a0a0a] border-white/5"
          }`}>
            <div className="flex items-center gap-3">
              <div className="shrink-0" style={{ color }}>{icon}</div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">{label}</p>
                <p className="text-xs text-white/30">{desc}</p>
              </div>
            </div>
            <button
              onClick={toggle}
              className={`w-12 h-6 rounded-full border transition-all duration-300 relative ${
                state ? "border-transparent" : "border-white/10 bg-white/5"
              }`}
              style={state ? { background: color } : {}}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                state ? "left-[26px]" : "left-0.5"
              }`} />
            </button>
          </div>
        ))}

        {/* Water intake */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Droplets size={15} className="text-[#38bdf8]" />
            <span className="text-sm font-semibold text-white">Water Intake</span>
            <span className="ml-auto text-sm font-black text-[#38bdf8]">{waterIntake}L</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                onClick={() => setWaterIntake(n)}
                className={`flex-1 min-w-[36px] py-2 rounded-xl text-sm font-bold transition-all duration-150 ${
                  waterIntake === n
                    ? "bg-[#38bdf8] text-black"
                    : "bg-white/4 text-white/40 hover:bg-white/8"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={saveTracker}
          disabled={saving || saved}
          className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
            saved
              ? "bg-green-500/15 border border-green-500/25 text-green-400"
              : "btn-gold"
          }`}
        >
          {saved ? (
            <><CheckCircle size={16} /> Saved!</>
          ) : saving ? (
            <><Loader2 size={16} className="animate-spin" /> Saving…</>
          ) : (
            <><Save size={16} /> Save Today</>
          )}
        </button>
      </motion.div>

      {/* Consistency calendar */}
      {trackingDays.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6"
        >
          <h2 className="text-base font-bold mb-1">Consistency Calendar</h2>
          <p className="text-white/30 text-xs mb-5">Click any day to see details.</p>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {trackingDays.slice(0, 28).map((day) => {
              const perfect = day.workout_completed && day.meal_plan_followed;
              const partial = day.workout_completed || day.meal_plan_followed;
              const bg = perfect ? "#22c55e" : partial ? "#D4AF37" : "#ef4444";
              const dayNum = new Date(day.tracking_date).getDate();

              return (
                <button
                  key={day.tracking_date}
                  onClick={() => setSelectedDay(selectedDay?.tracking_date === day.tracking_date ? null : day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 hover:scale-105 border ${
                    selectedDay?.tracking_date === day.tracking_date
                      ? "border-white/30"
                      : "border-transparent"
                  }`}
                  style={{ background: `${bg}25`, borderColor: selectedDay?.tracking_date === day.tracking_date ? bg : undefined }}
                  title={day.tracking_date}
                >
                  <span className="text-xs font-bold" style={{ color: bg }}>{dayNum}</span>
                  {day.water_intake > 0 && (
                    <span className="text-[8px] text-white/30">💧{day.water_intake}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 text-xs text-white/35">
            {[["#22c55e", "Perfect"], ["#D4AF37", "Partial"], ["#ef4444", "Missed"]].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: c }} />
                {l}
              </div>
            ))}
          </div>

          {/* Day detail */}
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-5 pt-5 border-t border-white/5"
            >
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                {new Date(selectedDay.tracking_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center">
                  <p className="text-xl mb-1">{selectedDay.workout_completed ? "✅" : "❌"}</p>
                  <p className="text-white/40 text-xs">Workout</p>
                </div>
                <div className="text-center">
                  <p className="text-xl mb-1">{selectedDay.meal_plan_followed ? "✅" : "❌"}</p>
                  <p className="text-white/40 text-xs">Meal Plan</p>
                </div>
                <div className="text-center">
                  <p className="text-xl mb-1">💧 {selectedDay.water_intake}L</p>
                  <p className="text-white/40 text-xs">Water</p>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className="text-2xl font-black text-[#D4AF37]">
                  {(selectedDay.workout_completed ? 50 : 0) + (selectedDay.meal_plan_followed ? 50 : 0)}%
                </span>
                <span className="text-white/30 text-xs ml-1">daily score</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
