import WorkoutPlanEditor from "@/components/workout/WorkoutPlanEditor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewWorkoutPlanPage() {
  return (
    <div>
      <Link href="/coach/workouts" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition">
        <ArrowLeft size={14} /> Back to Workout Library
      </Link>
      <p className="section-label mb-2">New Plan</p>
      <h1 className="text-3xl font-black mb-8">Create Workout Plan</h1>
      <WorkoutPlanEditor />
    </div>
  );
}
