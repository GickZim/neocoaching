"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/toast";
import { Loader2, CheckCircle, Weight, Zap, Moon, Brain, Dumbbell, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

function ScoreInput({
  label, icon, value, onChange, color = "#D4AF37",
}: {
  label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void; color?: string;
}) {
  const num = Number(value) || 0;
  return (
    <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="text-[#D4AF37]">{icon}</div>
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
        <span className="text-2xl font-black" style={{ color }}>{value || "—"}</span>
      </div>
      <div className="flex gap-1.5">
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <button
            key={n}
            onClick={() => onChange(String(n))}
            className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all duration-150 ${
              num >= n
                ? "text-black scale-100"
                : "bg-white/5 text-white/25 hover:bg-white/10"
            }`}
            style={num >= n ? { background: color } : {}}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CheckinsPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [weight, setWeight]              = useState("");
  const [energy, setEnergy]              = useState("");
  const [sleep, setSleep]                = useState("");
  const [stress, setStress]              = useState("");
  const [workoutAdherence, setWAdherence]= useState("");
  const [wins, setWins]                  = useState("");
  const [challenges, setChallenges]      = useState("");
  const [questions, setQuestions]        = useState("");

  const handleSubmit = async () => {
    if (!weight) { showToast("Please enter your current weight.", "error"); return; }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showToast("You must be logged in.", "error"); setLoading(false); return; }

    const { error } = await supabase.from("checkins").insert({
      user_id: user.id,
      weight:            Number(weight),
      energy_level:      Number(energy),
      sleep_quality:     Number(sleep),
      stress:            Number(stress),
      workout_adherence: Number(workoutAdherence),
      wins,
      challenges,
      questions,
    });

    setLoading(false);

    if (error) {
      showToast(error.message || "Could not submit check-in.", "error");
      return;
    }

    showToast("Check-in submitted! Great work this week. 💪", "success");
    setSubmitted(true);

    // Reset
    setWeight(""); setEnergy(""); setSleep(""); setStress(""); setWAdherence("");
    setWins(""); setChallenges(""); setQuestions("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="section-label mb-2">Weekly</p>
        <h1 className="text-3xl font-black mb-2">Check-In</h1>
        <p className="text-white/35 text-sm mb-8">
          Submit every week so your coach can track your progress and adjust your plan.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-4"
      >
        {/* Weight */}
        <div className="bg-[#0a0a0a] border border-[#D4AF37]/15 rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <Weight size={16} className="text-[#D4AF37]" />
            <label className="text-sm font-semibold text-white">Current Weight (kg)</label>
          </div>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 82.5"
            className="field-premium text-2xl font-black"
            step="0.1"
          />
        </div>

        {/* Score inputs */}
        <ScoreInput label="Energy Level" icon={<Zap size={16} />} value={energy} onChange={setEnergy} />
        <ScoreInput label="Sleep Quality" icon={<Moon size={16} />} value={sleep} onChange={setSleep} color="#818cf8" />
        <ScoreInput label="Stress Level"  icon={<Brain size={16} />} value={stress} onChange={setStress} color="#f87171" />
        <ScoreInput label="Workout Adherence %" icon={<Dumbbell size={16} />} value={workoutAdherence} onChange={setWAdherence} />

        {/* Text areas */}
        {[
          { label: "Biggest wins this week 🏆", value: wins, onChange: setWins, placeholder: "What went well? Any milestones hit?" },
          { label: "Challenges & struggles",    value: challenges, onChange: setChallenges, placeholder: "What made it hard? Be honest." },
          { label: "Questions for Coach Neo",   value: questions,  onChange: setQuestions,  placeholder: "Anything you want adjusted or clarified?" },
        ].map(({ label, value, onChange, placeholder }) => (
          <div key={label} className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <MessageSquare size={15} className="text-[#D4AF37]" />
              <label className="text-sm font-semibold text-white">{label}</label>
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="field-premium h-28 resize-none text-sm"
            />
          </div>
        ))}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || submitted}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
            submitted
              ? "bg-green-500/15 border border-green-500/25 text-green-400"
              : "btn-gold"
          }`}
        >
          {submitted ? (
            <><CheckCircle size={18} /> Submitted!</>
          ) : loading ? (
            <><Loader2 size={18} className="animate-spin" /> Submitting…</>
          ) : (
            "Submit Weekly Check-In"
          )}
        </button>
      </motion.div>
    </div>
  );
}
