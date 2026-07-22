"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/toast";
import { WorkoutDayWithExercises, WorkoutExercise } from "@/types/workout";
import {
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Upload,
  FileText,
  Save,
  X,
} from "lucide-react";

type DayDraft = WorkoutDayWithExercises & { _isNew?: boolean };
type ExerciseDraft = WorkoutExercise & { _isNew?: boolean };

let tempId = 0;
const newTempId = () => `temp-${Date.now()}-${tempId++}`;

export default function WorkoutPlanEditor({
  planId,
  initialTitle = "",
  initialDescription = "",
  initialGoal = "",
  initialDuration = null,
  initialPdfUrl = null,
  initialDays = [],
}: {
  planId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialGoal?: string;
  initialDuration?: number | null;
  initialPdfUrl?: string | null;
  initialDays?: DayDraft[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [goal, setGoal] = useState(initialGoal);
  const [duration, setDuration] = useState(initialDuration?.toString() ?? "");
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [uploading, setUploading] = useState(false);
  function emptyDay(order: number): DayDraft {
    return {
      id: newTempId(),
      plan_id: "",
      name: "",
      day_order: order,
      workout_exercises: [],
      _isNew: true,
    };
  }

  const [days, setDays] = useState<DayDraft[]>(
    initialDays.length ? initialDays : [emptyDay(0)],
  );
  const [saving, setSaving] = useState(false);

  function emptyExercise(): ExerciseDraft {
    return {
      id: newTempId(),
      day_id: "",
      name: "",
      sets: 3,
      reps: "10",
      rest_seconds: 60,
      notes: "",
      video_url: "",
      exercise_order: 0,
      _isNew: true,
    };
  }

  function addDay() {
    setDays((d) => [...d, emptyDay(d.length)]);
  }
  function removeDay(dayId: string) {
    setDays((d) => d.filter((x) => x.id !== dayId));
  }
  function updateDayName(dayId: string, name: string) {
    setDays((d) => d.map((x) => (x.id === dayId ? { ...x, name } : x)));
  }
  function addExercise(dayId: string) {
    setDays((d) =>
      d.map((x) =>
        x.id === dayId
          ? {
              ...x,
              workout_exercises: [...x.workout_exercises, emptyExercise()],
            }
          : x,
      ),
    );
  }
  function removeExercise(dayId: string, exId: string) {
    setDays((d) =>
      d.map((x) =>
        x.id === dayId
          ? {
              ...x,
              workout_exercises: x.workout_exercises.filter(
                (e) => e.id !== exId,
              ),
            }
          : x,
      ),
    );
  }
  function updateExercise(
    dayId: string,
    exId: string,
    field: keyof ExerciseDraft,
    value: string | number,
  ) {
    setDays((d) =>
      d.map((x) =>
        x.id === dayId
          ? {
              ...x,
              workout_exercises: x.workout_exercises.map((e) =>
                e.id === exId ? { ...e, [field]: value } : e,
              ),
            }
          : x,
      ),
    );
  }

  async function handlePdfUpload(file: File) {
    setUploading(true);
    const path = `workout-plans/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("plan-pdfs")
      .upload(path, file, { upsert: true });
    if (error) {
      showToast(error.message, "error");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("plan-pdfs").getPublicUrl(path);
    setPdfUrl(data.publicUrl);
    showToast("PDF uploaded.", "success");
    setUploading(false);
  }

  async function handleSave() {
    if (!title.trim()) {
      showToast("Plan title is required.", "error");
      return;
    }
    if (days.some((d) => !d.name.trim())) {
      showToast("Every workout day needs a name.", "error");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showToast("You must be logged in to save a plan.", "error");
        setSaving(false);
        return;
      }

      let activeplanId = planId;

      if (!activeplanId) {
        const { data, error } = await supabase
          .from("workout_plans")
          .insert({
            title,
            description,
            goal,
            duration_weeks: duration ? Number(duration) : null,
            pdf_url: pdfUrl,
            //coach_id: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        activeplanId = data.id;
      } else {
        const { error } = await supabase
          .from("workout_plans")
          .update({
            title,
            description,
            goal,
            duration_weeks: duration ? Number(duration) : null,
            pdf_url: pdfUrl,
          })
          .eq("id", activeplanId);
        if (error) throw error;
      }

      // Sync days
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        let activeDayId = day.id;

        if (day._isNew || day.id.startsWith("temp-")) {
          const { data, error } = await supabase
            .from("workout_days")
            .insert({
              plan_id: activeplanId,
              name: day.name,
              day_order: i,
            })
            .select()
            .single();
          if (error) throw error;
          activeDayId = data.id;
        } else {
          const { error } = await supabase
            .from("workout_days")
            .update({ name: day.name, day_order: i })
            .eq("id", day.id);
          if (error) throw error;
        }

        // Sync exercises
        for (let j = 0; j < day.workout_exercises.length; j++) {
          const ex = day.workout_exercises[j];
          const payload = {
            day_id: activeDayId,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds || null,
            notes: ex.notes || null,
            video_url: ex.video_url || null,
            exercise_order: j,
          };
          if (ex.id.startsWith("temp-")) {
            const { error } = await supabase
              .from("workout_exercises")
              .insert(payload);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("workout_exercises")
              .update(payload)
              .eq("id", ex.id);
            if (error) throw error;
          }
        }
      }

      showToast("Workout plan saved!", "success");
      router.push("/coach/workouts");
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to save plan.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "field-premium text-sm";

  return (
    <div className="pb-24 max-w-3xl">
      {/* Plan details */}
      <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-6 space-y-4 mb-6">
        <h2 className="font-bold text-sm text-white/50 uppercase tracking-wider mb-2">
          Plan Details
        </h2>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">
            Plan Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 12-Week Hypertrophy Program"
            className={fieldClass}
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of this program"
            className={fieldClass + " h-20 resize-none"}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Goal</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Muscle Gain"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">
              Duration (weeks)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="12"
              className={fieldClass}
            />
          </div>
        </div>

        {/* PDF upload */}
        <div>
          <label className="block text-xs text-white/40 mb-1.5">
            Workout PDF (optional)
          </label>
          {pdfUrl ? (
            <div className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
              <FileText size={16} className="text-[#D4AF37] shrink-0" />
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 hover:text-white truncate flex-1"
              >
                View uploaded PDF
              </a>
              <button
                onClick={() => setPdfUrl(null)}
                className="text-white/30 hover:text-red-400 transition"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-[#D4AF37]/30 rounded-xl py-6 cursor-pointer transition text-white/40 hover:text-white/60">
              {uploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              <span className="text-sm">
                {uploading ? "Uploading…" : "Click to upload PDF"}
              </span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) =>
                  e.target.files?.[0] && handlePdfUpload(e.target.files[0])
                }
              />
            </label>
          )}
        </div>
      </div>

      {/* Workout days */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-white/50 uppercase tracking-wider">
            Workout Days
          </h2>
          <button
            onClick={addDay}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:text-[#F5D97A] transition"
          >
            <Plus size={14} /> Add Day
          </button>
        </div>

        {days.map((day) => (
          <div
            key={day.id}
            className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <GripVertical size={14} className="text-white/15 shrink-0" />
              <input
                value={day.name}
                onChange={(e) => updateDayName(day.id, e.target.value)}
                placeholder="e.g. Push Day"
                className="flex-1 bg-transparent border-b border-white/10 focus:border-[#D4AF37]/50 outline-none text-base font-bold py-1.5 transition"
              />
              {days.length > 1 && (
                <button
                  onClick={() => removeDay(day.id)}
                  className="text-white/20 hover:text-red-400 transition shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            {/* Exercises */}
            <div className="space-y-3">
              {day.workout_exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-black/40 border border-white/5 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      value={ex.name}
                      onChange={(e) =>
                        updateExercise(day.id, ex.id, "name", e.target.value)
                      }
                      placeholder="Exercise name"
                      className="flex-1 bg-transparent border-b border-white/8 focus:border-[#D4AF37]/40 outline-none text-sm font-semibold py-1 transition"
                    />
                    <button
                      onClick={() => removeExercise(day.id, ex.id)}
                      className="text-white/20 hover:text-red-400 transition shrink-0 mt-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <label className="text-[10px] text-white/25 uppercase tracking-wider">
                        Sets
                      </label>
                      <input
                        type="number"
                        value={ex.sets}
                        onChange={(e) =>
                          updateExercise(
                            day.id,
                            ex.id,
                            "sets",
                            Number(e.target.value),
                          )
                        }
                        className="w-full bg-white/3 border border-white/6 rounded-lg px-2.5 py-1.5 text-sm mt-1 outline-none focus:border-[#D4AF37]/40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/25 uppercase tracking-wider">
                        Reps
                      </label>
                      <input
                        value={ex.reps}
                        onChange={(e) =>
                          updateExercise(day.id, ex.id, "reps", e.target.value)
                        }
                        placeholder="8-12"
                        className="w-full bg-white/3 border border-white/6 rounded-lg px-2.5 py-1.5 text-sm mt-1 outline-none focus:border-[#D4AF37]/40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/25 uppercase tracking-wider">
                        Rest (sec)
                      </label>
                      <input
                        type="number"
                        value={ex.rest_seconds ?? ""}
                        onChange={(e) =>
                          updateExercise(
                            day.id,
                            ex.id,
                            "rest_seconds",
                            Number(e.target.value),
                          )
                        }
                        placeholder="60"
                        className="w-full bg-white/3 border border-white/6 rounded-lg px-2.5 py-1.5 text-sm mt-1 outline-none focus:border-[#D4AF37]/40"
                      />
                    </div>
                  </div>
                  <input
                    value={ex.video_url ?? ""}
                    onChange={(e) =>
                      updateExercise(day.id, ex.id, "video_url", e.target.value)
                    }
                    placeholder="Video URL (optional)"
                    className="w-full bg-white/3 border border-white/6 rounded-lg px-2.5 py-1.5 text-xs mt-1 outline-none focus:border-[#D4AF37]/40 mb-2"
                  />
                  <input
                    value={ex.notes ?? ""}
                    onChange={(e) =>
                      updateExercise(day.id, ex.id, "notes", e.target.value)
                    }
                    placeholder="Coaching notes (optional)"
                    className="w-full bg-white/3 border border-white/6 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#D4AF37]/40"
                  />
                </div>
              ))}
              <button
                onClick={() => addExercise(day.id)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-white/10 hover:border-[#D4AF37]/30 text-white/30 hover:text-[#D4AF37] text-xs font-semibold transition"
              >
                <Plus size={13} /> Add Exercise
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-black/95 backdrop-blur-xl border-t border-white/5 p-4 z-30">
        <div className="max-w-3xl mx-auto flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gold flex items-center gap-2 text-sm px-6 py-3"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save size={15} /> Save Workout Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
