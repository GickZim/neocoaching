"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Trophy, TrendingUp, Loader2, Dumbbell } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

type LogRow = {
  exercise_id: string;
  logged_date: string;
  sets_data: { weight_kg: number | null; reps_completed: number | null }[];
};
type ExerciseInfo = { id: string; name: string };

export default function WorkoutHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<ExerciseInfo[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [prs, setPrs] = useState<
    {
      exercise_name: string;
      weight_kg: number;
      reps: number;
      achieved_date: string;
    }[]
  >([]);
  const [compliance, setCompliance] = useState(0);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: logData }, { data: prData }, { data: sessions }] =
        await Promise.all([
          supabase
            .from("workout_logs")
            .select(
              "exercise_id, logged_date, sets_data, workout_exercises(name)",
            )
            .eq("user_id", user.id)
            .order("logged_date", { ascending: true }),
          supabase
            .from("exercise_prs")
            .select("*")
            .eq("user_id", user.id)
            .order("achieved_date", { ascending: false }),
          supabase
            .from("workout_sessions")
            .select("completed")
            .eq("user_id", user.id),
        ]);

      if (logData) {
        setLogs(logData as unknown as LogRow[]);
        const uniqueExercises = new Map<string, string>();
        logData.forEach((l) => {
          const ex = Array.isArray(l.workout_exercises)
            ? l.workout_exercises[0]
            : l.workout_exercises;
          if (ex?.name) uniqueExercises.set(l.exercise_id, ex.name);
        });
        const exList = Array.from(uniqueExercises.entries()).map(
          ([id, name]) => ({ id, name }),
        );
        setExercises(exList);
        if (exList.length) setSelectedExercise(exList[0].id);
      }
      if (prData) setPrs(prData);
      if (sessions?.length) {
        setCompliance(
          Math.round(
            (sessions.filter((s) => s.completed).length / sessions.length) *
              100,
          ),
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  const exerciseLogs = logs.filter((l) => l.exercise_id === selectedExercise);
  const chartData = exerciseLogs.map((l) => {
    const bestSet = l.sets_data.reduce(
      (best, s) => ((s.weight_kg ?? 0) > (best.weight_kg ?? 0) ? s : best),
      l.sets_data[0] || { weight_kg: 0, reps_completed: 0 },
    );
    return {
      date: new Date(l.logged_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weight: bestSet?.weight_kg ?? 0,
      volume: l.sets_data.reduce(
        (s, set) => s + (set.weight_kg ?? 0) * (set.reps_completed ?? 0),
        0,
      ),
    };
  });

  const bestEver = exerciseLogs.reduce<{
    weight_kg: number | null;
    reps_completed: number | null;
  }>(
    (best, l) => {
      const bestSet = l.sets_data.reduce<{
        weight_kg: number | null;
        reps_completed: number | null;
      }>((b, s) => ((s.weight_kg ?? 0) > (b.weight_kg ?? 0) ? s : b), {
        weight_kg: 0,
        reps_completed: 0,
      });
      return (bestSet.weight_kg ?? 0) > (best.weight_kg ?? 0) ? bestSet : best;
    },
    { weight_kg: 0, reps_completed: 0 },
  );

  if (loading)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="animate-spin text-[#D4AF37]" size={28} />
      </div>
    );

  return (
    <div className="pb-12">
      <Link
        href="/dashboard/workouts"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition"
      >
        <ArrowLeft size={14} /> Back to Workout Plans
      </Link>

      <p className="section-label mb-2">Progress</p>
      <h1 className="text-3xl font-black mb-1">Workout History</h1>
      <p className="text-white/35 text-sm mb-8">
        Track your progression over time.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5">
          <TrendingUp size={16} className="text-[#D4AF37] mb-2" />
          <p className="text-2xl font-black">{compliance}%</p>
          <p className="text-white/30 text-xs mt-1">Compliance Rate</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5">
          <Dumbbell size={16} className="text-[#D4AF37] mb-2" />
          <p className="text-2xl font-black">{exercises.length}</p>
          <p className="text-white/30 text-xs mt-1">Exercises Logged</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5">
          <Trophy size={16} className="text-[#D4AF37] mb-2" />
          <p className="text-2xl font-black">{prs.length}</p>
          <p className="text-white/30 text-xs mt-1">Personal Records</p>
        </div>
      </div>

      {/* Exercise progress chart */}
      {exercises.length > 0 ? (
        <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
            <h2 className="font-bold text-base">Exercise Progression</h2>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="bg-white/4 border border-white/8 rounded-lg px-3 py-1.5 text-sm outline-none"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
          {(bestEver.weight_kg ?? 0) > 0 && (
            <p className="text-white/35 text-sm mb-4">
              Best set:{" "}
              <span className="text-[#D4AF37] font-bold">
                {bestEver.weight_kg}kg × {bestEver.reps_completed}
              </span>
            </p>
          )}
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#52525b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#52525b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f0f0f",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 13,
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#D4AF37"
                strokeWidth={2.5}
                dot={{ fill: "#D4AF37", r: 4 }}
                name="Top Set (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-16 text-center mb-8">
          <Dumbbell size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">
            Log your first workout to see progression charts here.
          </p>
        </div>
      )}

      {/* Personal Records */}
      {prs.length > 0 && (
        <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-[#D4AF37]" />
            <h2 className="font-bold text-base">Personal Records</h2>
          </div>
          <div className="space-y-2">
            {prs.map((pr, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-3 border-b border-white/4 last:border-0"
              >
                <span className="font-medium text-sm">{pr.exercise_name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#D4AF37] font-bold text-sm">
                    {pr.weight_kg}kg × {pr.reps}
                  </span>
                  <span className="text-white/25 text-xs">
                    {new Date(pr.achieved_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
