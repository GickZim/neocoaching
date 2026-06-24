"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type WorkoutPlan = {
  id: string;
  title: string;
  description: string;
  pdf_url: string;
  created_at: string;
};

export default function WorkoutsPage() {
  const [workoutsPlans, setWorkoutsPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutsPlans();
    async function loadWorkoutsPlans() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data: assignments, error: assignmentError } = await supabase
          .from("client_workouts")
          .select("workout_id")
          .eq("client_id", user.id);

        if (assignmentError) {
          console.error(assignmentError);
          setLoading(false);
          return;
        }

        if (!assignments || assignments.length === 0) {
          setWorkoutsPlans([]);
          setLoading(false);
          return;
        }

        const workoutPlanIds = assignments.map((item) => item.workout_id);

        const { data: plans, error: plansError } = await supabase
          .from("workout_plans")
          .select("*")
          .in("id", workoutPlanIds);

        if (plansError) {
          console.error(plansError);
          setLoading(false);
          return;
        }

        setWorkoutsPlans(plans || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  if (loading) {
    return <div className="text-white">Loading workout plans...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white">My Workout Plans</h1>

      {workoutsPlans.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400">No workout plans assigned yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {workoutsPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-2">
                {plan.title}
              </h2>

              <p className="text-zinc-400 mb-6">{plan.description}</p>

              <a
                href={plan.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex bg-[#D4AF37] text-black px-5 py-3 rounded-xl font-semibold"
              >
                Open Workout Plan
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
