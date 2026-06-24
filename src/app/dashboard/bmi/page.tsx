"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BMIPage() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Load Height
        const { data: profile } = await supabase
          .from("profiles")
          .select("height_cm")
          .eq("id", user.id)
          .single();

        if (profile?.height_cm) {
          setHeight(profile.height_cm.toString());
        }

        // Load Latest Weight
        const { data: latestCheckin } = await supabase
          .from("checkins")
          .select("weight")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (latestCheckin?.weight) {
          setWeight(Number(latestCheckin.weight));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  async function saveHeight() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        height_cm: Number(height),
      })
      .eq("id", user.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Height saved successfully");
  }

  const h = Number(height) / 100;

  const bmi = height && weight ? Number((weight / (h * h)).toFixed(1)) : null;

  function getCategory(value: number) {
    if (value < 18.5) return "Underweight";
    if (value < 25) return "Healthy Weight";
    if (value < 30) return "Overweight";
    return "Obese";
  }

  if (loading) {
    return <div className="text-white">Loading BMI...</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-2">BMI Calculator</h1>

      <p className="text-zinc-400 mb-8">
        Your BMI updates automatically using your latest check-in weight.
      </p>

      <div className="max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <div className="mb-6">
          <label className="block text-zinc-400 mb-2">Height (cm)</label>

          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Enter your height"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white"
          />

          <button
            onClick={saveHeight}
            className="mt-4 bg-[#D4AF37] text-black px-5 py-3 rounded-xl font-bold"
          >
            Save Height
          </button>
        </div>

        <div className="border-t border-zinc-800 pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-zinc-500">Latest Weight</p>

              <h2 className="text-4xl font-bold text-white">
                {weight ?? "--"} kg
              </h2>
            </div>

            <div>
              <p className="text-zinc-500">Current BMI</p>

              <h2 className="text-4xl font-bold text-[#D4AF37]">
                {bmi ?? "--"}
              </h2>
            </div>
          </div>

          {bmi && (
            <div className="mt-8">
              <div className="bg-black rounded-2xl p-6 border border-zinc-800">
                <p className="text-zinc-400 mb-2">BMI Category</p>

                <h3 className="text-2xl font-bold text-white">
                  {getCategory(bmi)}
                </h3>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
