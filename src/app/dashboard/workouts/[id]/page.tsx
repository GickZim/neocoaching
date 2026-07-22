"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/toast";
import { WorkoutPlanFull } from "@/types/workout";
import ExerciseLogCard from "@/components/workout/ExerciseLogCard";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  CheckCircle,
  Flame,
  Battery,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ClientWorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<WorkoutPlanFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [completed, setCompleted] = useState(false);
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [savingSession, setSavingSession] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("workout_plans")
        .select("*, workout_days(*, workout_exercises(*))")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        data.workout_days?.sort(
          (a: { day_order: number }, b: { day_order: number }) =>
            a.day_order - b.day_order,
        );
        data.workout_days?.forEach(
          (d: { workout_exercises: { exercise_order: number }[] }) =>
            d.workout_exercises?.sort(
              (a, b) => a.exercise_order - b.exercise_order,
            ),
        );
        setPlan(data);
        if (data.workout_days?.length) setActiveDayId(data.workout_days[0].id);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    async function loadSession() {
      if (!userId || !activeDayId) return;
      const { data } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("day_id", activeDayId)
        .eq("logged_date", today)
        .maybeSingle();
      if (data) {
        setCompleted(data.completed);
        setNotes(data.notes ?? "");
        setDifficulty(data.difficulty);
        setEnergy(data.energy);
      } else {
        setCompleted(false);
        setNotes("");
        setDifficulty(null);
        setEnergy(null);
      }
    }
    loadSession();
  }, [userId, activeDayId, today]);

  async function saveSession() {
    if (!userId || !activeDayId || !plan) return;
    setSavingSession(true);
    const { error } = await supabase.from("workout_sessions").upsert(
      {
        user_id: userId,
        plan_id: plan.id,
        day_id: activeDayId,
        logged_date: today,
        completed,
        notes,
        difficulty,
        energy,
      },
      { onConflict: "user_id,day_id,logged_date" },
    );
    setSavingSession(false);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast(
      completed ? "Workout marked complete! 💪" : "Session saved.",
      "success",
    );
  }

  if (loading)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="animate-spin text-[#D4AF37]" size={28} />
      </div>
    );
  if (!plan)
    return (
      <p className="text-white/40 text-center py-32">Workout plan not found.</p>
    );

  const activeDay = plan.workout_days.find((d) => d.id === activeDayId);

  return (
    <div className="pb-12 max-w-2xl">
      <Link
        href="/dashboard/workouts"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition"
      >
        <ArrowLeft size={14} /> Back to Workout Plans
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a1200] to-[#0a0a0a] border border-[#D4AF37]/20 rounded-2xl p-6 mb-6">
        <p className="section-label mb-2">{plan.goal || "Workout Plan"}</p>
        <h1 className="text-2xl font-black mb-1">{plan.title}</h1>
        <p className="text-white/35 text-sm mb-4">
          Coach Neo{" "}
          {plan.duration_weeks ? `· ${plan.duration_weeks} week program` : ""}
        </p>
        {plan.pdf_url && (
          <div className="flex gap-2">
            <a
              href={plan.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white/70 hover:text-white transition"
            >
              <FileText size={14} /> View PDF
            </a>
            <a
              href={plan.pdf_url}
              download
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white/70 hover:text-white transition"
            >
              <Download size={14} /> Download
            </a>
          </div>
        )}
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        {plan.workout_days.map((day) => (
          <button
            key={day.id}
            onClick={() => setActiveDayId(day.id)}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeDayId === day.id
                ? "bg-[#D4AF37] text-black"
                : "bg-white/4 border border-white/8 text-white/50 hover:text-white"
            }`}
          >
            {day.name}
          </button>
        ))}
      </div>

      {/* Exercises */}
      {activeDay && (
        <motion.div
          key={activeDay.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3 mb-8"
        >
          {activeDay.workout_exercises.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-12">
              No exercises added for this day yet.
            </p>
          ) : (
            activeDay.workout_exercises.map(
              (ex) =>
                userId && (
                  <ExerciseLogCard
                    key={ex.id}
                    exercise={ex}
                    userId={userId}
                    planId={plan.id}
                    dayId={activeDay.id}
                    logDate={today}
                  />
                ),
            )
          )}
        </motion.div>
      )}

      {/* Session completion */}
      {activeDay && (
        <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-sm text-white/50 uppercase tracking-wider">
            Finish {activeDay.name}
          </h2>

          <button
            onClick={() => setCompleted((c) => !c)}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all ${
              completed
                ? "bg-green-500/15 border border-green-500/30 text-green-400"
                : "bg-white/4 border border-white/10 text-white/60 hover:text-white"
            }`}
          >
            <CheckCircle size={16} />{" "}
            {completed ? "Workout Completed" : "Mark Workout Complete"}
          </button>

          {/* Difficulty */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame size={14} className="text-[#D4AF37]" />
              <span className="text-sm font-semibold">
                Perceived Difficulty
              </span>
              <span className="ml-auto text-sm font-black text-[#D4AF37]">
                {difficulty ?? "—"}
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setDifficulty(n)}
                  className={`flex-1 h-7 rounded-lg text-xs font-bold transition ${(difficulty ?? 0) >= n ? "bg-[#D4AF37] text-black" : "bg-white/5 text-white/25"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Battery size={14} className="text-emerald-400" />
              <span className="text-sm font-semibold">Energy Level</span>
              <span className="ml-auto text-sm font-black text-emerald-400">
                {energy ?? "—"}
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setEnergy(n)}
                  className={`flex-1 h-7 rounded-lg text-xs font-bold transition ${(energy ?? 0) >= n ? "bg-emerald-400 text-black" : "bg-white/5 text-white/25"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1.5 block">
              Workout Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it feel? Anything to flag for your coach?"
              className="field-premium h-20 resize-none text-sm"
            />
          </div>

          <button
            onClick={saveSession}
            disabled={savingSession}
            className="btn-gold w-full text-sm py-3"
          >
            {savingSession ? "Saving…" : "Save Session"}
          </button>
        </div>
      )}
    </div>
  );
}
