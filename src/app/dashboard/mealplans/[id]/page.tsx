"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/toast";
import { MealPlanFull } from "@/types/meal";
import { ArrowLeft, Download, FileText, Loader2, Check, Flame } from "lucide-react";
import { motion } from "framer-motion";

export default function ClientMealPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<MealPlanFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: planData }, { data: logData }] = await Promise.all([
        supabase.from("meal_plans").select("*, meals(*, meal_foods(*))").eq("id", id).single(),
        supabase.from("meal_logs").select("meal_id").eq("user_id", user.id).eq("logged_date", today).eq("completed", true),
      ]);

      if (planData) {
        planData.meals?.sort((a: { meal_order: number }, b: { meal_order: number }) => a.meal_order - b.meal_order);
        planData.meals?.forEach((m: { meal_foods: { food_order: number }[] }) => m.meal_foods?.sort((a, b) => a.food_order - b.food_order));
        setPlan(planData);
      }
      if (logData) setCompletedMeals(new Set(logData.map(l => l.meal_id)));
      setLoading(false);
    }
    load();
  }, [id, today]);

  async function toggleMeal(mealId: string) {
    if (!userId || !plan) return;
    const isCompleted = completedMeals.has(mealId);
    const newSet = new Set(completedMeals);
    if (isCompleted) newSet.delete(mealId); else newSet.add(mealId);
    setCompletedMeals(newSet);

    const { error } = await supabase.from("meal_logs").upsert({
      user_id: userId, plan_id: plan.id, meal_id: mealId, logged_date: today, completed: !isCompleted,
    }, { onConflict: "user_id,meal_id,logged_date" });

    if (error) { showToast(error.message, "error"); return; }
    if (!isCompleted) showToast("Meal logged! 🍽️", "success");
  }

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-[#D4AF37]" size={28} /></div>;
  if (!plan) return <p className="text-white/40 text-center py-32">Meal plan not found.</p>;

  const compliancePct = plan.meals.length ? Math.round((completedMeals.size / plan.meals.length) * 100) : 0;

  return (
    <div className="pb-12 max-w-2xl">
      <Link href="/dashboard/mealplans" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition">
        <ArrowLeft size={14} /> Back to Meal Plans
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a1200] to-[#0a0a0a] border border-[#D4AF37]/20 rounded-2xl p-6 mb-6">
        <p className="section-label mb-2">{plan.goal || "Meal Plan"}</p>
        <h1 className="text-2xl font-black mb-4">{plan.title}</h1>

        {/* Macros */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Calories", value: plan.calories, unit: "kcal" },
            { label: "Protein", value: plan.protein_g, unit: "g" },
            { label: "Carbs", value: plan.carbs_g, unit: "g" },
            { label: "Fats", value: plan.fats_g, unit: "g" },
          ].map(({ label, value, unit }) => (
            <div key={label} className="text-center bg-black/30 rounded-xl py-3">
              <p className="text-xl font-black text-[#D4AF37]">{value ?? "—"}</p>
              <p className="text-white/30 text-[10px] uppercase tracking-wider mt-0.5">{label}{value ? ` ${unit}` : ""}</p>
            </div>
          ))}
        </div>

        {plan.pdf_url && (
          <div className="flex gap-2">
            <a href={plan.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white/70 hover:text-white transition"><FileText size={14} /> View PDF</a>
            <a href={plan.pdf_url} download className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white/70 hover:text-white transition"><Download size={14} /> Download</a>
          </div>
        )}
      </div>

      {/* Today's compliance */}
      <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Today's Compliance</span>
          <span className="text-[#D4AF37] font-black">{compliancePct}%</span>
        </div>
        <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${compliancePct}%` }} /></div>
      </div>

      {/* Meals */}
      <div className="space-y-3">
        {plan.meals.map((meal, i) => {
          const isDone = completedMeals.has(meal.id);
          const mealCalories = meal.meal_foods.reduce((s, f) => s + (f.calories ?? 0), 0);
          return (
            <motion.div key={meal.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border p-5 transition-all ${isDone ? "bg-green-500/5 border-green-500/20" : "bg-[#0a0a0a] border-white/6"}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-base">{meal.name}</h3>
                  {meal.time_suggestion && <p className="text-white/30 text-xs">{meal.time_suggestion}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {mealCalories > 0 && <span className="flex items-center gap-1 text-xs text-white/35"><Flame size={11} /> {mealCalories} kcal</span>}
                  <button onClick={() => toggleMeal(meal.id)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${isDone ? "bg-green-500 border-green-500" : "border-white/15 hover:border-[#D4AF37]/40"}`}>
                    {isDone && <Check size={14} className="text-black" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {meal.meal_foods.map(food => (
                  <div key={food.id} className="flex items-center justify-between text-sm">
                    <span className="text-white/60">{food.name} <span className="text-white/30">— {food.quantity}</span></span>
                    {food.calories && <span className="text-white/30 text-xs">{food.calories} kcal</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
