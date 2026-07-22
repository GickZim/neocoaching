"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/toast";
import { MealWithFoods, MealFood } from "@/types/meal";
import { Plus, Trash2, Loader2, Upload, FileText, Save, X, Sparkles } from "lucide-react";
import MealPlanImporter, { ImportedPlan } from "@/components/meal/MealPlanImporter";

type MealDraft = MealWithFoods;
type FoodDraft = MealFood;

let tempId = 0;
const newTempId = () => `temp-${Date.now()}-${tempId++}`;

export default function MealPlanEditor({
  planId, initialTitle = "", initialDescription = "", initialGoal = "",
  initialCalories = null, initialProtein = null, initialCarbs = null, initialFats = null,
  initialPdfUrl = null, initialMeals = [],
}: {
  planId?: string; initialTitle?: string; initialDescription?: string; initialGoal?: string;
  initialCalories?: number | null; initialProtein?: number | null; initialCarbs?: number | null; initialFats?: number | null;
  initialPdfUrl?: string | null; initialMeals?: MealDraft[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [goal, setGoal] = useState(initialGoal);
  const [calories, setCalories] = useState(initialCalories?.toString() ?? "");
  const [protein, setProtein] = useState(initialProtein?.toString() ?? "");
  const [carbs, setCarbs] = useState(initialCarbs?.toString() ?? "");
  const [fats, setFats] = useState(initialFats?.toString() ?? "");
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [uploading, setUploading] = useState(false);
  const [meals, setMeals] = useState<MealDraft[]>(initialMeals.length ? initialMeals : [emptyMeal(0)]);
  const [saving, setSaving] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  function handleImport(imported: ImportedPlan) {
    setTitle(imported.title || title);
    setDescription(imported.description || description);
    setGoal(imported.goal || goal);
    if (imported.calories) setCalories(imported.calories.toString());
    if (imported.protein_g) setProtein(imported.protein_g.toString());
    if (imported.carbs_g) setCarbs(imported.carbs_g.toString());
    if (imported.fats_g) setFats(imported.fats_g.toString());

    if (imported.meals?.length) {
      const mapped: MealDraft[] = imported.meals.map((m, i) => ({
        id: newTempId(),
        plan_id: "",
        name: m.name,
        meal_order: i,
        time_suggestion: m.time_suggestion ?? "",
        meal_foods: m.meal_foods.map((f, j) => ({
          id: newTempId(),
          meal_id: "",
          name: f.name,
          quantity: f.quantity,
          calories: f.calories,
          protein_g: f.protein_g,
          carbs_g: f.carbs_g,
          fats_g: f.fats_g,
          food_order: j,
        })),
      }));
      setMeals(mapped);
    }

    setShowImporter(false);
    showToast("Meal plan imported! Review and save.", "gold");
  }

  function emptyMeal(order: number): MealDraft {
    return { id: newTempId(), plan_id: "", name: "", meal_order: order, time_suggestion: "", meal_foods: [] };
  }
  function emptyFood(): FoodDraft {
    return { id: newTempId(), meal_id: "", name: "", quantity: "", calories: null, protein_g: null, carbs_g: null, fats_g: null, food_order: 0 };
  }

  function addMeal() { setMeals(m => [...m, emptyMeal(m.length)]); }
  function removeMeal(id: string) { setMeals(m => m.filter(x => x.id !== id)); }
  function updateMeal(id: string, field: "name" | "time_suggestion", value: string) {
    setMeals(m => m.map(x => x.id === id ? { ...x, [field]: value } : x));
  }
  function addFood(mealId: string) {
    setMeals(m => m.map(x => x.id === mealId ? { ...x, meal_foods: [...x.meal_foods, emptyFood()] } : x));
  }
  function removeFood(mealId: string, foodId: string) {
    setMeals(m => m.map(x => x.id === mealId ? { ...x, meal_foods: x.meal_foods.filter(f => f.id !== foodId) } : x));
  }
  function updateFood(mealId: string, foodId: string, field: keyof FoodDraft, value: string | number) {
    setMeals(m => m.map(x => x.id === mealId
      ? { ...x, meal_foods: x.meal_foods.map(f => f.id === foodId ? { ...f, [field]: value } : f) }
      : x));
  }

  async function handlePdfUpload(file: File) {
    setUploading(true);
    const path = `meal-plans/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("plan-pdfs").upload(path, file, { upsert: true });
    if (error) { showToast(error.message, "error"); setUploading(false); return; }
    const { data } = supabase.storage.from("plan-pdfs").getPublicUrl(path);
    setPdfUrl(data.publicUrl);
    showToast("PDF uploaded.", "success");
    setUploading(false);
  }

  async function handleSave() {
    if (!title.trim()) { showToast("Plan title is required.", "error"); return; }
    if (meals.some(m => !m.name.trim())) { showToast("Every meal needs a name.", "error"); return; }

    setSaving(true);
    try {
      let activeId = planId;
      const planPayload = {
        title, description, goal,
        calories: calories ? Number(calories) : null,
        protein_g: protein ? Number(protein) : null,
        carbs_g: carbs ? Number(carbs) : null,
        fats_g: fats ? Number(fats) : null,
        pdf_url: pdfUrl,
      };

      if (!activeId) {
        const { data, error } = await supabase.from("meal_plans").insert(planPayload).select().single();
        if (error) throw error;
        activeId = data.id;
      } else {
        const { error } = await supabase.from("meal_plans").update(planPayload).eq("id", activeId);
        if (error) throw error;
      }

      for (let i = 0; i < meals.length; i++) {
        const meal = meals[i];
        let activeMealId = meal.id;

        if (meal.id.startsWith("temp-")) {
          const { data, error } = await supabase.from("meals").insert({
            plan_id: activeId, name: meal.name, meal_order: i, time_suggestion: meal.time_suggestion || null,
          }).select().single();
          if (error) throw error;
          activeMealId = data.id;
        } else {
          const { error } = await supabase.from("meals").update({
            name: meal.name, meal_order: i, time_suggestion: meal.time_suggestion || null,
          }).eq("id", meal.id);
          if (error) throw error;
        }

        for (let j = 0; j < meal.meal_foods.length; j++) {
          const food = meal.meal_foods[j];
          const foodPayload = {
            meal_id: activeMealId, name: food.name, quantity: food.quantity,
            calories: food.calories, protein_g: food.protein_g, carbs_g: food.carbs_g, fats_g: food.fats_g,
            food_order: j,
          };
          if (food.id.startsWith("temp-")) {
            const { error } = await supabase.from("meal_foods").insert(foodPayload);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("meal_foods").update(foodPayload).eq("id", food.id);
            if (error) throw error;
          }
        }
      }

      showToast("Meal plan saved!", "success");
      router.push("/coach/mealplans");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to save plan.", "error");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "field-premium text-sm";

  return (
    <div className="pb-24 max-w-3xl">
      {showImporter && <MealPlanImporter onImport={handleImport} onClose={() => setShowImporter(false)} />}

      {/* AI Import Banner */}
      <div className="bg-gradient-to-r from-[#1a1200] to-[#0a0a0a] border border-[#D4AF37]/20 rounded-2xl p-4 mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gold-gradient-bg flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-black" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Have an existing meal plan document?</p>
            <p className="text-white/35 text-xs mt-0.5">Upload your .docx or .pdf — AI fills in everything automatically.</p>
          </div>
        </div>
        <button
          onClick={() => setShowImporter(true)}
          className="btn-gold shrink-0 text-xs px-4 py-2.5 flex items-center gap-1.5"
        >
          <Sparkles size={13} /> AI Import
        </button>
      </div>

      <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-6 space-y-4 mb-6">
        <h2 className="font-bold text-sm text-white/50 uppercase tracking-wider mb-2">Plan Details</h2>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Plan Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Lean Cut Meal Plan" className={fieldClass} />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief overview" className={fieldClass + " h-20 resize-none"} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Goal</label>
            <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Fat Loss" className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Calories</label>
            <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="2200" className={fieldClass} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs text-white/40 mb-1.5">Protein (g)</label><input type="number" value={protein} onChange={e => setProtein(e.target.value)} className={fieldClass} /></div>
          <div><label className="block text-xs text-white/40 mb-1.5">Carbs (g)</label><input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} className={fieldClass} /></div>
          <div><label className="block text-xs text-white/40 mb-1.5">Fats (g)</label><input type="number" value={fats} onChange={e => setFats(e.target.value)} className={fieldClass} /></div>
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">Meal Plan PDF (optional)</label>
          {pdfUrl ? (
            <div className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
              <FileText size={16} className="text-[#D4AF37] shrink-0" />
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 hover:text-white truncate flex-1">View uploaded PDF</a>
              <button onClick={() => setPdfUrl(null)} className="text-white/30 hover:text-red-400 transition"><X size={15} /></button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-[#D4AF37]/30 rounded-xl py-6 cursor-pointer transition text-white/40 hover:text-white/60">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <span className="text-sm">{uploading ? "Uploading…" : "Click to upload PDF"}</span>
              <input type="file" accept="application/pdf" className="hidden" disabled={uploading} onChange={e => e.target.files?.[0] && handlePdfUpload(e.target.files[0])} />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-white/50 uppercase tracking-wider">Meals</h2>
          <button onClick={addMeal} className="flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:text-[#F5D97A] transition">
            <Plus size={14} /> Add Meal
          </button>
        </div>

        {meals.map(meal => (
          <div key={meal.id} className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <input value={meal.name} onChange={e => updateMeal(meal.id, "name", e.target.value)} placeholder="e.g. Breakfast"
                className="flex-1 bg-transparent border-b border-white/10 focus:border-[#D4AF37]/50 outline-none text-base font-bold py-1.5 transition" />
              <input value={meal.time_suggestion ?? ""} onChange={e => updateMeal(meal.id, "time_suggestion", e.target.value)} placeholder="7:00 AM"
                className="w-28 bg-white/4 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#D4AF37]/40" />
              {meals.length > 1 && <button onClick={() => removeMeal(meal.id)} className="text-white/20 hover:text-red-400 transition"><Trash2 size={15} /></button>}
            </div>

            <div className="space-y-2">
              {meal.meal_foods.map(food => (
                <div key={food.id} className="bg-black/40 border border-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input value={food.name} onChange={e => updateFood(meal.id, food.id, "name", e.target.value)} placeholder="Food name"
                      className="flex-1 bg-transparent border-b border-white/8 focus:border-[#D4AF37]/40 outline-none text-sm font-medium py-1" />
                    <input value={food.quantity} onChange={e => updateFood(meal.id, food.id, "quantity", e.target.value)} placeholder="100g"
                      className="w-20 bg-white/3 border border-white/6 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#D4AF37]/40" />
                    <button onClick={() => removeFood(meal.id, food.id)} className="text-white/20 hover:text-red-400 transition shrink-0"><Trash2 size={13} /></button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["calories", "protein_g", "carbs_g", "fats_g"] as const).map(field => (
                      <input key={field} type="number" value={food[field] ?? ""} onChange={e => updateFood(meal.id, food.id, field, Number(e.target.value))}
                        placeholder={field === "calories" ? "kcal" : field.replace("_g", "")} className="bg-white/3 border border-white/6 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#D4AF37]/40" />
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => addFood(meal.id)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-white/10 hover:border-[#D4AF37]/30 text-white/30 hover:text-[#D4AF37] text-xs font-semibold transition">
                <Plus size={13} /> Add Food
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-black/95 backdrop-blur-xl border-t border-white/5 p-4 z-30">
        <div className="max-w-3xl mx-auto flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-gold flex items-center gap-2 text-sm px-6 py-3">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Meal Plan</>}
          </button>
        </div>
      </div>
    </div>
  );
}
