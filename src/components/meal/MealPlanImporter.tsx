"use client";

import { useState, useRef } from "react";
import { Loader2, Sparkles, FileText, X, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

type ImportedFood = {
  name: string;
  quantity: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
};

type ImportedMeal = {
  name: string;
  time_suggestion: string | null;
  meal_foods: ImportedFood[];
};

export type ImportedPlan = {
  title: string;
  description: string;
  goal: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  meals: ImportedMeal[];
};

type Props = {
  onImport: (plan: ImportedPlan) => void;
  onClose: () => void;
};

const SYSTEM_PROMPT = `You are a nutrition data extractor. Extract meal plan data from documents and return ONLY valid JSON with no markdown, no backticks, no preamble, no explanation. Return nothing except the JSON object.

The JSON must match this exact structure:
{
  "title": "string",
  "description": "string",
  "goal": "string",
  "calories": number or null,
  "protein_g": number or null,
  "carbs_g": number or null,
  "fats_g": number or null,
  "meals": [
    {
      "name": "string",
      "time_suggestion": "string or null",
      "meal_foods": [
        {
          "name": "string",
          "quantity": "string",
          "calories": number or null,
          "protein_g": number or null,
          "carbs_g": number or null,
          "fats_g": number or null
        }
      ]
    }
  ]
}`;

export default function MealPlanImporter({ onImport, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<ImportedPlan | null>(null);
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set([0]));
  const [dayIndex, setDayIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleMeal(i: number) {
    setExpandedMeals(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function readFileAsBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  async function handleScan() {
    if (!file) return;
    setScanning(true);
    setError(null);
    setPreview(null);

    try {
      const base64 = await readFileAsBase64(file);
      const dayLabel = dayIndex === 0 ? "Day 1" : `Day ${dayIndex + 1}`;

      // Determine media type
      let mediaType = "application/pdf";
      if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        mediaType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else if (file.name.endsWith(".txt")) {
        // For plain text, read as text and send directly
        const text = await file.text();
        const result = await callClaudeWithText(text, dayLabel);
        setPreview(result);
        setScanning(false);
        return;
      }

      const result = await callClaudeWithDocument(base64, mediaType, dayLabel);
      setPreview(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to scan document. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  async function callClaudeWithDocument(base64: string, mediaType: string, dayLabel: string): Promise<ImportedPlan> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Extract the ${dayLabel} meal plan from this document. Use the daily macro totals for ${dayLabel} as the top-level calories/protein_g/carbs_g/fats_g. Extract every meal and every food item with quantities and macros. Return only the JSON.`,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  }

  async function callClaudeWithText(text: string, dayLabel: string): Promise<ImportedPlan> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: `Extract the ${dayLabel} meal plan from the text below. Use the daily macro totals for ${dayLabel}. Return only JSON.\n\n${text.slice(0, 15000)}`,
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#0a0a0a] border border-[#D4AF37]/20 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/5 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gold-gradient-bg flex items-center justify-center">
              <Sparkles size={16} className="text-black" />
            </div>
            <div>
              <h2 className="font-bold text-base">AI Meal Plan Import</h2>
              <p className="text-white/35 text-xs">Upload your document — AI fills in everything</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!preview && (
            <>
              {/* File drop zone */}
              <div>
                <label
                  className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-10 px-6 cursor-pointer transition-all ${
                    file ? "border-[#D4AF37]/40 bg-[#D4AF37]/5" : "border-white/10 hover:border-[#D4AF37]/30 hover:bg-white/2"
                  }`}
                  onClick={() => fileRef.current?.click()}
                >
                  {file ? (
                    <>
                      <FileText size={28} className="text-[#D4AF37]" />
                      <div className="text-center">
                        <p className="font-semibold text-sm text-white">{file.name}</p>
                        <p className="text-white/35 text-xs mt-1">{(file.size / 1024).toFixed(0)} KB — ready to scan</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setFile(null); setError(null); }}
                        className="text-xs text-white/30 hover:text-red-400 transition"
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
                        <FileText size={22} className="text-white/30" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm text-white">Drop your meal plan here</p>
                        <p className="text-white/35 text-xs mt-1">Supports .docx, .pdf, .txt</p>
                      </div>
                    </>
                  )}
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".docx,.doc,.pdf,.txt"
                  className="hidden"
                  onChange={e => { e.target.files?.[0] && setFile(e.target.files[0]); setError(null); }}
                />
              </div>

              {/* Day selector */}
              <div className="bg-white/3 border border-white/6 rounded-xl p-4">
                <p className="text-xs text-white/40 mb-2 font-medium">Which day do you want to import?</p>
                <div className="flex gap-2 flex-wrap">
                  {["Day 1","Day 2","Day 3","Day 4","Day 5","Day 6","Day 7"].map((d, i) => (
                    <button key={d} onClick={() => setDayIndex(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        dayIndex === i ? "bg-[#D4AF37] text-black" : "bg-white/5 text-white/40 hover:text-white"
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-white/25 text-xs mt-2">For 7-day rotation plans — import each day as a separate meal plan.</p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button onClick={handleScan} disabled={!file || scanning}
                className="btn-gold w-full flex items-center justify-center gap-2 py-4 text-sm disabled:opacity-40">
                {scanning
                  ? <><Loader2 size={16} className="animate-spin" /> Scanning document…</>
                  : <><Sparkles size={16} /> Scan & Extract Meal Plan</>
                }
              </button>

              {scanning && (
                <div className="text-center space-y-1">
                  <p className="text-white/40 text-xs">AI is reading your document and extracting meals, foods, and macros…</p>
                  <p className="text-white/20 text-xs">This takes 5–15 seconds</p>
                </div>
              )}
            </>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <CheckCircle size={16} />
                <span className="text-sm font-semibold">Extracted — review before importing</span>
              </div>

              {/* Summary */}
              <div className="bg-[#111] border border-white/6 rounded-2xl p-5 space-y-3">
                <div>
                  <p className="text-xs text-white/30 mb-1">Plan Title</p>
                  <p className="font-bold text-base">{preview.title}</p>
                </div>
                {preview.goal && (
                  <div>
                    <p className="text-xs text-white/30 mb-1">Goal</p>
                    <p className="text-sm text-[#D4AF37] font-semibold">{preview.goal}</p>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-3 pt-1">
                  {[
                    { label: "Calories", value: preview.calories, unit: "kcal" },
                    { label: "Protein", value: preview.protein_g, unit: "g" },
                    { label: "Carbs", value: preview.carbs_g, unit: "g" },
                    { label: "Fats", value: preview.fats_g, unit: "g" },
                  ].map(({ label, value, unit }) => (
                    <div key={label} className="bg-white/3 rounded-xl py-3 text-center">
                      <p className="text-lg font-black text-[#D4AF37]">{value ?? "—"}</p>
                      <p className="text-white/30 text-[10px] uppercase tracking-wider mt-0.5">{label}{value ? ` ${unit}` : ""}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meals */}
              <div className="space-y-2">
                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">{preview.meals.length} meals extracted</p>
                {preview.meals.map((meal, i) => (
                  <div key={i} className="bg-[#111] border border-white/6 rounded-xl overflow-hidden">
                    <button onClick={() => toggleMeal(i)} className="w-full flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{meal.name}</span>
                        {meal.time_suggestion && <span className="text-white/30 text-xs">{meal.time_suggestion}</span>}
                        <span className="text-white/20 text-xs">· {meal.meal_foods.length} foods</span>
                      </div>
                      {expandedMeals.has(i) ? <ChevronUp size={14} className="text-white/30"/> : <ChevronDown size={14} className="text-white/30"/>}
                    </button>
                    {expandedMeals.has(i) && (
                      <div className="px-4 pb-3 space-y-1.5 border-t border-white/5 pt-3">
                        {meal.meal_foods.map((food, j) => (
                          <div key={j} className="flex items-center justify-between text-sm">
                            <span className="text-white/60">{food.name} <span className="text-white/30">— {food.quantity}</span></span>
                            {food.calories && <span className="text-white/30 text-xs">{food.calories} kcal</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setPreview(null); setFile(null); }}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm font-semibold transition">
                  Try Again
                </button>
                <button onClick={() => onImport(preview)}
                  className="flex-1 btn-gold flex items-center justify-center gap-2 text-sm py-3">
                  <CheckCircle size={15} /> Import into Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
