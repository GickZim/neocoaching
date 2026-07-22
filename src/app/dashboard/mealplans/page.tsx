"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { UtensilsCrossed, FileText, Flame, ArrowRight, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { MealPlan } from "@/types/meal";

type AssignedPlan = MealPlan & { assigned_at?: string };

export default function ClientMealPlansPage() {
  const [plans, setPlans] = useState<AssignedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("client_mealplans").select("created_at, meal_plans(*)").eq("client_id", user.id);
      if (data) {
        const mapped = data
          .map((row) => {
            const plan = Array.isArray(row.meal_plans) ? row.meal_plans[0] : row.meal_plans;
            return plan ? { ...plan, assigned_at: row.created_at } : null;
          })
          .filter((p): p is AssignedPlan => p !== null && !p.archived);
        setPlans(mapped);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="space-y-4"><div className="skeleton h-10 w-56 rounded" /><div className="grid sm:grid-cols-2 gap-4">{[1, 2].map(i => <div key={i} className="skeleton h-44 rounded-2xl" />)}</div></div>;
  }

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="section-label mb-2">Nutrition</p>
          <h1 className="text-3xl font-black">My Meal Plans</h1>
          <p className="text-white/35 text-sm mt-1">Stay on track with your nutrition goals.</p>
        </div>
        <Link href="/dashboard/mealplans/analytics" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/4 border border-white/8 hover:border-white/15 text-sm font-semibold text-white/60 hover:text-white transition">
          <BarChart3 size={15} /> Nutrition Analytics
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-16 text-center">
          <UtensilsCrossed size={36} className="text-white/10 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No meal plan assigned yet</h3>
          <p className="text-white/30 text-sm">Your coach will assign you a nutrition plan soon.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {plans.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}>
              <Link href={`/dashboard/mealplans/${plan.id}`}
                className="block bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[#D4AF37]/15 hover:border-[#D4AF37]/35 rounded-2xl p-6 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl gold-gradient-bg flex items-center justify-center"><UtensilsCrossed size={20} className="text-black" /></div>
                  <ArrowRight size={16} className="text-white/20 group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
                </div>
                <h2 className="font-bold text-lg mb-1">{plan.title}</h2>
                {plan.goal && <p className="text-[#D4AF37] text-xs font-semibold mb-3">{plan.goal}</p>}
                <div className="flex items-center gap-3 text-xs text-white/30">
                  {plan.calories && <span className="flex items-center gap-1"><Flame size={11} /> {plan.calories} kcal</span>}
                  {plan.pdf_url && <span className="flex items-center gap-1"><FileText size={11} /> PDF available</span>}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
