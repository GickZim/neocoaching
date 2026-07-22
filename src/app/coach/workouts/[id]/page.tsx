"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import WorkoutPlanEditor from "@/components/workout/WorkoutPlanEditor";
import { ArrowLeft, Loader2 } from "lucide-react";
import { WorkoutPlanFull } from "@/types/workout";

export default function EditWorkoutPlanPage() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<WorkoutPlanFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("workout_plans")
        .select("*, workout_days(*, workout_exercises(*))")
        .eq("id", id)
        .single();

      if (data) {
        // sort days and exercises by order
        data.workout_days?.sort((a: { day_order: number }, b: { day_order: number }) => a.day_order - b.day_order);
        data.workout_days?.forEach((d: { workout_exercises: { exercise_order: number }[] }) =>
          d.workout_exercises?.sort((a, b) => a.exercise_order - b.exercise_order)
        );
        setPlan(data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-[#D4AF37]" size={28} /></div>;
  }

  if (!plan) {
    return <p className="text-white/40 text-center py-32">Plan not found.</p>;
  }

  return (
    <div>
      <Link href="/coach/workouts" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition">
        <ArrowLeft size={14} /> Back to Workout Library
      </Link>
      <p className="section-label mb-2">Edit Plan</p>
      <h1 className="text-3xl font-black mb-8">{plan.title}</h1>
      <WorkoutPlanEditor
        planId={plan.id}
        initialTitle={plan.title}
        initialDescription={plan.description}
        initialGoal={plan.goal ?? ""}
        initialDuration={plan.duration_weeks}
        initialPdfUrl={plan.pdf_url}
        initialDays={plan.workout_days}
      />
    </div>
  );
}
