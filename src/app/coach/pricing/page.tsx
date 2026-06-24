"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PricingPlan = {
  id: string;
  name: string;
  original_price: number;
  promo_price: number | null;
  promo_active: boolean;
  promo_end_date: string | null;
  save_percentage: number;
};

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);

  useEffect(() => {
    fetchPlans();
  }, []);
  async function fetchPlans() {
    const { data } = await supabase
      .from("pricing_plans")
      .select("*")
      .order("name");

    setPlans(data || []);
  }

  async function save(plan: PricingPlan) {
    const savePercentage = plan.promo_price
      ? Math.round(
          ((plan.original_price - plan.promo_price) / plan.original_price) *
            100,
        )
      : 0;
    console.log(plan);
    const { data, error } = await supabase
      .from("pricing_plans")
      .update({
        original_price: plan.original_price,
        promo_price: plan.promo_price,
        promo_active: plan.promo_active,

        promo_end_date: plan.promo_end_date
          ? `${plan.promo_end_date}T23:59:59`
          : null,

        save_percentage: savePercentage,
      })
      .eq("id", plan.id);

    console.log("Saving:", {
      promo_end_date: plan.promo_end_date,
    });

    console.log("Result:", data);
    console.log("Error:", error);

    if (!error) {
      alert("Pricing Updated");
      fetchPlans();
    }
  }

  function updatePlan(
    id: string,
    field: keyof PricingPlan,
    value: string | number | boolean | null,
  ) {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              [field]: value,
            }
          : plan,
      ),
    );
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold mb-8">Pricing Manager</h1>

      <div className="space-y-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <h2 className="text-2xl font-bold mb-6">{plan.name}</h2>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-zinc-400 block mb-2">
                  Original Price
                </label>

                <input
                  type="number"
                  value={plan.original_price}
                  onChange={(e) =>
                    updatePlan(
                      plan.id,
                      "original_price",
                      Number(e.target.value),
                    )
                  }
                  className="w-full bg-black border border-zinc-700 p-3 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">
                  Promo Price
                </label>

                <input
                  type="number"
                  value={plan.promo_price || ""}
                  onChange={(e) =>
                    updatePlan(plan.id, "promo_price", Number(e.target.value))
                  }
                  className="w-full bg-black border border-zinc-700 p-3 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">
                  Promo End Date
                </label>

                <input
                  type="date"
                  value={
                    plan.promo_end_date ? plan.promo_end_date.split("T")[0] : ""
                  }
                  onChange={(e) =>
                    updatePlan(plan.id, "promo_end_date", e.target.value)
                  }
                  className="w-full bg-black border border-zinc-700 p-3 rounded-lg"
                />
              </div>

              <div className="flex items-center mt-8">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={plan.promo_active}
                    onChange={(e) =>
                      updatePlan(plan.id, "promo_active", e.target.checked)
                    }
                  />
                  Promo Active
                </label>
              </div>
            </div>

            {plan.promo_price && (
              <div className="mt-4 text-[#D4AF37] font-semibold">
                Save{" "}
                {Math.round(
                  ((plan.original_price - plan.promo_price) /
                    plan.original_price) *
                    100,
                )}
                %
              </div>
            )}

            <button
              onClick={() => save(plan)}
              className="mt-6 bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition"
            >
              Save Changes
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
