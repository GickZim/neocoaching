"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Star } from "lucide-react";
import { showToast } from "@/components/ui/toast";
import { ToastProvider } from "@/components/ui/toast";

const PROGRAMS = ["Basic", "Standard", "VIP 1:1"];

const STEPS = [
  { id: 1, label: "Program",  title: "Choose Your Plan",          sub: "Select the coaching level that fits your goals." },
  { id: 2, label: "About You", title: "Tell Us About You",        sub: "Basic info so your coach can personalise your plan." },
  { id: 3, label: "Goals",    title: "Your Fitness Goals",        sub: "Help your coach understand what you're working toward." },
  { id: 4, label: "Mindset",  title: "Your Why & Commitment",    sub: "This helps us ensure coaching is the right fit for you." },
];

const FIELD_CLASS =
  "w-full bg-[#0f0f0f] border border-white/8 rounded-xl px-4 py-3.5 text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/8 transition-all text-sm";
const SELECT_CLASS = FIELD_CLASS + " appearance-none cursor-pointer";
const LABEL_CLASS = "block text-xs font-semibold text-white/45 uppercase tracking-wider mb-2";

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    program: "",
    fullName: "",
    age: "",
    country: "",
    email: "",
    whatsapp: "",
    currentWeight: "",
    targetWeight: "",
    experience: "",
    gymAccess: "",
    goal: "",
    challenge: "",
    injuries: "",
    reason: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("selectedProgram");
    if (saved) {
      setFormData((p) => ({ ...p, program: saved }));
      localStorage.removeItem("selectedProgram");
    }
  }, []);

  const set = (field: string, value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

  function validateStep(s: number): string | null {
    if (s === 1 && !formData.program) return "Please select a coaching program.";
    if (s === 2) {
      if (!formData.fullName.trim()) return "Full name is required.";
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        return "Enter a valid email address.";
      if (!formData.age || Number(formData.age) < 16 || Number(formData.age) > 80)
        return "Enter a valid age (16–80).";
      if (!formData.country.trim()) return "Country is required.";
    }
    if (s === 3) {
      if (!formData.goal.trim()) return "Please describe your fitness goal.";
      if (!formData.experience) return "Please select your training experience.";
      if (!formData.gymAccess)  return "Please indicate your gym access.";
    }
    if (s === 4 && !formData.reason.trim()) return "Please tell us your reason for applying.";
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) { showToast(err, "error"); return; }
    if (step < 4) setStep((s) => s + 1);
  }

  async function handleSubmit() {
    const err = validateStep(4);
    if (err) { showToast(err, "error"); return; }

    try {
      setLoading(true);
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/thank-you");
      } else {
        showToast("Something went wrong. Please try again.", "error");
      }
    } catch {
      showToast("Submission failed. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;
  const currentStep = STEPS[step - 1];

  return (
    <>
      <ToastProvider />
      <main className="min-h-screen bg-black text-white">
        {/* Top bar */}
        <div className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-3xl mx-auto px-5 h-[68px] flex items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image src="/images/logo1.png" alt="NeoCoaching" width={32} height={32} className="rounded-lg" />
              <span className="font-black text-base hidden sm:inline">
                <span className="text-[#D4AF37]">Neo</span>Coaching
              </span>
            </Link>

            {/* Step progress bar */}
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-[10px] text-white/25 mb-1.5 font-medium">
                {STEPS.map((s) => (
                  <span key={s.id} className={step >= s.id ? "text-[#D4AF37]" : ""}>{s.label}</span>
                ))}
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <span className="text-xs text-white/30 shrink-0 hidden sm:inline">
              Step {step} of {STEPS.length}
            </span>
          </div>
        </div>

        <div className="pt-[68px] pb-24 px-5">
          <div className="max-w-2xl mx-auto py-12">

            {/* Step header */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <p className="section-label mb-3">{currentStep.label}</p>
                <h1 className="text-3xl font-black mb-2">{currentStep.title}</h1>
                <p className="text-white/35 text-sm mb-10">{currentStep.sub}</p>

                {/* ── STEP 1: Program ── */}
                {step === 1 && (
                  <div className="space-y-4">
                    {/* Trust blurb */}
                    <div className="flex items-start gap-4 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-2xl p-5 mb-6">
                      <Image src="/images/logo1.png" alt="" width={44} height={44} className="rounded-xl shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">Personally reviewed by Coach Neo</p>
                        <p className="text-white/35 text-sm leading-relaxed">
                          Every application is read personally. You'll hear back within 24 hours.
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#D4AF37" color="#D4AF37" />)}
                          <span className="text-xs text-white/35 ml-1">20+ clients transformed</span>
                        </div>
                      </div>
                    </div>

                    {PROGRAMS.map((p) => (
                      <button
                        key={p}
                        onClick={() => set("program", p)}
                        className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 ${
                          formData.program === p
                            ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.08)]"
                            : "bg-[#0a0a0a] border-white/6 hover:border-white/12"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-base ${formData.program === p ? "text-[#D4AF37]" : "text-white"}`}>{p}</span>
                          {formData.program === p && <CheckCircle size={18} className="text-[#D4AF37]" />}
                        </div>
                        {p === "VIP 1:1" && (
                          <span className="text-xs text-white/35 mt-1 block">Custom 1:1 coaching with weekly calls & priority support</span>
                        )}
                        {p === "Standard" && (
                          <span className="text-xs text-white/35 mt-1 block">Full coaching system with weekly check-ins</span>
                        )}
                        {p === "Basic" && (
                          <span className="text-xs text-white/35 mt-1 block">Structured plan to get you started</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── STEP 2: About You ── */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL_CLASS}>Full Name</label>
                      <input type="text" value={formData.fullName} onChange={(e) => set("fullName", e.target.value)}
                        placeholder="Your full name" className={FIELD_CLASS} autoComplete="name" />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Email Address</label>
                      <input type="email" value={formData.email} onChange={(e) => set("email", e.target.value)}
                        placeholder="you@example.com" className={FIELD_CLASS} autoComplete="email" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL_CLASS}>Age</label>
                        <input type="number" value={formData.age} onChange={(e) => set("age", e.target.value)}
                          placeholder="e.g. 28" className={FIELD_CLASS} min="16" max="80" />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Country</label>
                        <input type="text" value={formData.country} onChange={(e) => set("country", e.target.value)}
                          placeholder="e.g. South Africa" className={FIELD_CLASS} />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>WhatsApp Number</label>
                      <input type="text" value={formData.whatsapp} onChange={(e) => set("whatsapp", e.target.value)}
                        placeholder="+27 00 000 0000" className={FIELD_CLASS} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL_CLASS}>Current Weight (kg)</label>
                        <input type="number" value={formData.currentWeight} onChange={(e) => set("currentWeight", e.target.value)}
                          placeholder="e.g. 85" className={FIELD_CLASS} step="0.1" />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Target Weight (kg)</label>
                        <input type="number" value={formData.targetWeight} onChange={(e) => set("targetWeight", e.target.value)}
                          placeholder="e.g. 75" className={FIELD_CLASS} step="0.1" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Goals ── */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL_CLASS}>Training Experience</label>
                      <select value={formData.experience} onChange={(e) => set("experience", e.target.value)} className={SELECT_CLASS}>
                        <option value="">Select your level</option>
                        <option>Beginner (0–6 Months)</option>
                        <option>Intermediate (6 Months – 2 Years)</option>
                        <option>Advanced (2+ Years)</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Gym Access</label>
                      <select value={formData.gymAccess} onChange={(e) => set("gymAccess", e.target.value)} className={SELECT_CLASS}>
                        <option value="">Select one</option>
                        <option>Yes — full gym</option>
                        <option>Home gym / equipment</option>
                        <option>No gym — bodyweight only</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Your Primary Fitness Goal</label>
                      <textarea value={formData.goal} onChange={(e) => set("goal", e.target.value)}
                        placeholder="e.g. Lose 10kg of fat, build lean muscle, improve my energy levels…"
                        className={FIELD_CLASS + " h-28 resize-none"} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Biggest Challenge Right Now</label>
                      <textarea value={formData.challenge} onChange={(e) => set("challenge", e.target.value)}
                        placeholder="e.g. Staying consistent, not sure what to eat, lack of motivation…"
                        className={FIELD_CLASS + " h-24 resize-none"} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Injuries or Medical Conditions <span className="text-white/20 normal-case font-normal">(optional)</span></label>
                      <textarea value={formData.injuries} onChange={(e) => set("injuries", e.target.value)}
                        placeholder="Any relevant injuries or health conditions your coach should know about"
                        className={FIELD_CLASS + " h-20 resize-none"} />
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Mindset ── */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div>
                      <label className={LABEL_CLASS}>Why NeoCoaching? What made you apply today?</label>
                      <textarea value={formData.reason} onChange={(e) => set("reason", e.target.value)}
                        placeholder="Be honest — what's your motivation and what have you tried before?"
                        className={FIELD_CLASS + " h-36 resize-none"} />
                    </div>

                    {/* Summary */}
                    <div className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5 space-y-3">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Application Summary</p>
                      {[
                        { label: "Program",  value: formData.program },
                        { label: "Name",     value: formData.fullName },
                        { label: "Email",    value: formData.email },
                        { label: "Goal",     value: formData.goal?.slice(0, 60) + (formData.goal?.length > 60 ? "…" : "") },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-white/30">{label}</span>
                          <span className="text-white font-medium text-right max-w-[200px] truncate">{value || "—"}</span>
                        </div>
                      ))}
                    </div>

                    {/* Trust */}
                    <p className="text-center text-white/25 text-xs leading-relaxed">
                      🔒 Your information is kept private and reviewed only by Coach Neo.
                      <br />You'll receive a personal response within 24 hours.
                    </p>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-10">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition text-sm font-semibold"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              <div className="flex-1" />
              {step < 4 ? (
                <button onClick={next} className="btn-gold flex items-center gap-2 text-sm px-7 py-3.5">
                  Continue <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-gold flex items-center gap-2 text-sm px-7 py-3.5"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                  ) : (
                    <>Submit Application <CheckCircle size={14} /></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
