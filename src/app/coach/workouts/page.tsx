"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AssignClientModal from "@/components/AssignClientModal";

type WorkoutPlan = {
  id: string;
  title: string;
  description: string;
  pdf_url: string;
  created_at: string;
};

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  useEffect(() => {
    loadWorkouts();
    async function loadWorkouts() {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setWorkouts(data || []);
      setLoading(false);
    }
  }, []);

  async function deleteWorkout(id: string) {
    const confirmed = confirm(
      "Are you sure you want to delete this workout plan?",
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("workout_plans")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setWorkouts((prev) => prev.filter((workout) => workout.id !== id));

    alert("Workout deleted");
  }

  if (loading) {
    return <div className="text-white">Loading workouts...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Workout Library</h1>

        <p className="text-zinc-400 mt-2">Manage all workout programs.</p>
      </div>

      {workouts.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <p className="text-zinc-400">No workout plans uploaded yet.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                {workout.title}
              </h2>

              <p className="text-zinc-400 mb-6">{workout.description}</p>

              <div className="flex flex-wrap gap-3">
                <a
                  href={workout.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#D4AF37] text-black px-5 py-2 rounded-xl font-semibold"
                >
                  Open PDF
                </a>

                <button
                  onClick={() => deleteWorkout(workout.id)}
                  className="bg-red-600 px-5 py-2 rounded-xl font-semibold"
                >
                  Delete
                </button>

                <button
                  onClick={() => {
                    setSelectedPlan(workout.id);
                    setShowAssignModal(true);
                  }}
                  className="bg-zinc-800 text-white px-5 py-2 rounded-xl font-semibold"
                >
                  Assign Client
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AssignClientModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        itemId={selectedPlan}
        assignmentTable="client_workouts"
        assignmentField="workout_id"
      />
    </div>
  );
}
