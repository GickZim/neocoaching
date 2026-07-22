"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MealPlanEditor from "@/components/meal/MealPlanEditor";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MealPlanFull } from "@/types/meal";

export default function EditMealPlanPage() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<MealPlanFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("meal_plans").select("*, meals(*, meal_foods(*))").eq("id", id).single();
      if (data) {
        data.meals?.sort((a: { meal_order: number }, b: { meal_order: number }) => a.meal_order - b.meal_order);
        data.meals?.forEach((m: { meal_foods: { food_order: number }[] }) => m.meal_foods?.sort((a, b) => a.food_order - b.food_order));
        setPlan(data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-[#D4AF37]" size={28} /></div>;
  if (!plan) return <p className="text-white/40 text-center py-32">Plan not found.</p>;

  return (
    <div>
      <Link href="/coach/mealplans" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition">
        <ArrowLeft size={14} /> Back to Meal Plan Library
      </Link>
      <p className="section-label mb-2">Edit Plan</p>
      <h1 className="text-3xl font-black mb-8">{plan.title}</h1>
      <MealPlanEditor
        planId={plan.id} initialTitle={plan.title} initialDescription={plan.description ?? ""} initialGoal={plan.goal ?? ""}
        initialCalories={plan.calories} initialProtein={plan.protein_g} initialCarbs={plan.carbs_g} initialFats={plan.fats_g}
        initialPdfUrl={plan.pdf_url} initialMeals={plan.meals}
      />
    </div>
  );
}
