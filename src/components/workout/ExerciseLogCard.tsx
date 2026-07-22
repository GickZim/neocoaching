"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/toast";
import { WorkoutExercise, SetLog } from "@/types/workout";
import { Check, Clock, PlayCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function ExerciseLogCard({
  exercise,
  userId,
  planId,
  dayId,
  logDate,
}: {
  exercise: WorkoutExercise;
  userId: string;
  planId: string;
  dayId: string;
  logDate: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [sets, setSets] = useState<SetLog[]>(
    Array.from({ length: exercise.sets }, (_, i) => ({
      set_number: i + 1,
      weight_kg: null,
      reps_completed: null,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadExisting() {
      const { data } = await supabase
        .from("workout_logs")
        .select("sets_data")
        .eq("user_id", userId)
        .eq("exercise_id", exercise.id)
        .eq("logged_date", logDate)
        .maybeSingle();
      if (data?.sets_data) {
        setSets(data.sets_data);
        setSaved(true);
      }
    }
    loadExisting();
  }, [exercise.id, userId, logDate]);

  function updateSet(
    idx: number,
    field: "weight_kg" | "reps_completed",
    value: string,
  ) {
    setSets((prev) =>
      prev.map((s, i) =>
        i === idx ? { ...s, [field]: value === "" ? null : Number(value) } : s,
      ),
    );
    setSaved(false);
  }

  async function saveExercise() {
    setSaving(true);
    const { error } = await supabase.from("workout_logs").upsert(
      {
        user_id: userId,
        plan_id: planId,
        day_id: dayId,
        exercise_id: exercise.id,
        logged_date: logDate,
        sets_data: sets,
      },
      { onConflict: "user_id,exercise_id,logged_date" },
    );
    setSaving(false);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast(`${exercise.name} saved.`, "success");
    setSaved(true);
  }

  const completedSets = sets.filter(
    (s) => s.weight_kg !== null && s.reps_completed !== null,
  ).length;

  return (
    <div
      className={`bg-black/40 border rounded-xl overflow-hidden transition-all ${saved && completedSets === sets.length ? "border-green-500/20" : "border-white/6"}`}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              completedSets === sets.length && saved
                ? "bg-green-500/15 text-green-400"
                : "bg-white/5 text-[#D4AF37]"
            }`}
          >
            {completedSets === sets.length && saved ? (
              <Check size={14} />
            ) : (
              <span className="text-xs font-bold">
                {completedSets}/{sets.length}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-white truncate">
              {exercise.name}
            </p>
            <p className="text-xs text-white/35">
              {exercise.sets} sets × {exercise.reps} reps{" "}
              {exercise.rest_seconds ? `· ${exercise.rest_seconds}s rest` : ""}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-white/30 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-white/30 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {exercise.video_url && (
            <a
              href={exercise.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-[#F5D97A] transition mb-2"
            >
              <PlayCircle size={13} /> Watch demo video
            </a>
          )}
          {exercise.notes && (
            <p className="text-xs text-white/40 bg-white/3 border border-white/5 rounded-lg p-3 mb-2">
              {exercise.notes}
            </p>
          )}

          {/* Set inputs */}
          <div className="space-y-2">
            <div className="grid grid-cols-[40px_1fr_1fr] gap-2 text-[10px] text-white/25 uppercase tracking-wider px-1">
              <span>Set</span>
              <span>Weight (kg)</span>
              <span>Reps</span>
            </div>
            {sets.map((s, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[40px_1fr_1fr] gap-2 items-center"
              >
                <span className="text-sm font-bold text-white/40 text-center">
                  {s.set_number}
                </span>
                <input
                  type="number"
                  value={s.weight_kg ?? ""}
                  onChange={(e) => updateSet(idx, "weight_kg", e.target.value)}
                  placeholder="0"
                  className="bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-center outline-none focus:border-[#D4AF37]/40"
                />
                <input
                  type="number"
                  value={s.reps_completed ?? ""}
                  onChange={(e) =>
                    updateSet(idx, "reps_completed", e.target.value)
                  }
                  placeholder="0"
                  className="bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-center outline-none focus:border-[#D4AF37]/40"
                />
              </div>
            ))}
          </div>

          <button
            onClick={saveExercise}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] text-sm font-semibold hover:bg-[#D4AF37]/15 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Exercise"}
          </button>
        </div>
      )}
    </div>
  );
}
