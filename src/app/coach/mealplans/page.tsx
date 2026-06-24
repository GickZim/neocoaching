"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AssignClientModal from "@/components/AssignClientModal";

type MealPlan = {
  id: string;
  title: string;
  description: string;
  pdf_url: string;
  created_at: string;
};

export default function MealPlansPage() {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  useEffect(() => {
    loadPlans();
    async function loadPlans() {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .order("created_at", { ascending: false });
  
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
  
      setPlans(data || []);
      setLoading(false);
    }
  }, []);


  async function deletePlan(id: string) {
    const confirmed = confirm(
      "Are you sure you want to delete this meal plan?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setPlans((prev) => prev.filter((plan) => plan.id !== id));

    alert("Meal plan deleted");
  }

  if (loading) {
    return <div className="text-white">Loading meal plans...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">
          Meal Plan Library
        </h1>

        <p className="text-zinc-400 mt-2">
          Manage all nutrition plans.
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <p className="text-zinc-400">
            No meal plans uploaded yet.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                {plan.title}
              </h2>

              <p className="text-zinc-400 mb-6">
                {plan.description}
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href={plan.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#D4AF37] text-black px-5 py-2 rounded-xl font-semibold"
                >
                  Open PDF
                </a>

                <button
                  onClick={() => deletePlan(plan.id)}
                  className="bg-red-600 px-5 py-2 rounded-xl font-semibold text-white"
                >
                  Delete
                </button>

                <button
                  onClick={() => {
                    setSelectedPlan(plan.id);
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
        assignmentTable="client_meal_plans"
        assignmentField="meal_plan_id"
      />
    </div>
  );
}