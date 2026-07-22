import MealPlanEditor from "@/components/meal/MealPlanEditor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewMealPlanPage() {
  return (
    <div>
      <Link href="/coach/mealplans" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition">
        <ArrowLeft size={14} /> Back to Meal Plan Library
      </Link>
      <p className="section-label mb-2">New Plan</p>
      <h1 className="text-3xl font-black mb-8">Create Meal Plan</h1>
      <MealPlanEditor />
    </div>
  );
}
