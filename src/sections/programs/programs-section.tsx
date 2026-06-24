"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Star, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PromoCountdown from "@/components/PromoCountdown";

type PricingPlan = {
  id: string;
  name: string;
  original_price: number;
  promo_price: number | null;
  promo_active: boolean;
  promo_end_date: string | null;
  save_percentage: number;
};

const planMeta: Record<string, { icon: React.ReactNode; badge?: string; description: string; featured: boolean }> = {
  Basic: {
    icon: <Zap size={20} />,
    description: "Perfect for beginners who need structure and a starting point.",
    featured: false,
  },
  Standard: {
    icon: <Star size={20} />,
    badge: "MOST POPULAR",
    description: "Full coaching with accountability — the complete transformation package.",
    featured: true,
  },
  "VIP 1:1": {
    icon: <Crown size={20} />,
    badge: "PREMIUM",
    description: "White-glove 1:1 coaching with unlimited access and weekly calls.",
    featured: false,
  },
};

const featuresMap: Record<string, string[]> = {
  Basic: [
    "Workout Plan",
    "Simple Meal Guide",
    "Access to App",
  ],
  Standard: [
    "Custom Workout Plan",
    "Customized Meal Plan",
    "Weekly Progress Tracking",
    "1 Video Check-in Per Week",
    "Full Neo Coaching System",
  ],
  "VIP 1:1": [
    "Custom Training Program",
    "Custom Nutrition Plan",
    "Adjustable Weekly Check-ins",
    "Unlimited WhatsApp Support",
    "Full Neo Coaching System",
    "Weekly Coaching Calls",
    "Personal Development Calls",
    "Priority Check-ins",
  ],
};

const planOrder = ["Basic", "Standard", "VIP 1:1"];

export default function ProgramsSection() {
  const [programs, setPrograms] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      const { data } = await supabase.from("pricing_plans").select("*").order("name");
      if (!data) { setLoading(false); return; }

      const now = new Date();
      const cleaned = data.map((p) =>
        p.promo_active && p.promo_end_date && new Date(p.promo_end_date) < now
          ? { ...p, promo_active: false }
          : p
      );

      // Sort by canonical plan order
      cleaned.sort(
        (a, b) => planOrder.indexOf(a.name) - planOrder.indexOf(b.name)
      );

      setPrograms(cleaned);
      setLoading(false);
    }
    fetchPlans();
  }, []);

  const handleApply = (planName: string) => {
    localStorage.setItem("selectedProgram", planName);
    window.location.href = "/apply";
  };

  return (
    <section id="programs" className="bg-black text-white py-32 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D4AF37]/2 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <p className="section-label mb-4">Coaching Programs</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
            Choose Your{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #D4AF37, #F5D97A, #C9A227)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Transformation Plan
            </span>
          </h2>
          <p className="text-white/45 mt-4 max-w-xl mx-auto text-base">
            Every plan is built around your goals, your lifestyle, and your schedule.
          </p>
        </motion.div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl p-8 border border-white/5 bg-[#0a0a0a] space-y-4">
                <div className="skeleton h-6 w-24 rounded" />
                <div className="skeleton h-10 w-32 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="space-y-3 mt-6">
                  {[1,2,3,4].map(j => <div key={j} className="skeleton h-4 w-full rounded" />)}
                </div>
                <div className="skeleton h-12 w-full rounded-full mt-6" />
              </div>
            ))}
          </div>
        )}

        {/* Plan cards */}
        {!loading && (
          <div className="grid lg:grid-cols-3 gap-6 items-stretch">
            {programs.map((program, index) => {
              const meta = planMeta[program.name] ?? { featured: false, description: "" };
              const isVIP = program.name === "VIP 1:1";
              const isFeatured = meta.featured;
              const displayPrice = program.promo_active && program.promo_price
                ? program.promo_price
                : program.original_price;

              return (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.12 }}
                  className={`relative rounded-3xl flex flex-col overflow-hidden transition-all duration-300 ${
                    isVIP
                      ? "border border-[#D4AF37]/40 bg-gradient-to-b from-[#1a1200] via-[#0f0c00] to-black shadow-[0_0_60px_rgba(212,175,55,0.12)] hover:shadow-[0_0_80px_rgba(212,175,55,0.2)]"
                      : isFeatured
                      ? "border border-[#D4AF37]/25 bg-gradient-to-b from-[#111] to-black hover:border-[#D4AF37]/40"
                      : "border border-white/6 bg-[#0a0a0a] hover:border-white/12"
                  }`}
                >
                  {/* Badge */}
                  {meta.badge && (
                    <div className={`absolute top-0 left-0 right-0 text-center py-2 text-xs font-black tracking-widest ${
                      isVIP
                        ? "gold-gradient-bg text-black"
                        : "bg-[#D4AF37]/15 text-[#D4AF37]"
                    }`}>
                      {meta.badge}
                    </div>
                  )}

                  <div className={`p-8 flex-1 flex flex-col ${meta.badge ? "pt-12" : ""}`}>
                    {/* Plan header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isVIP ? "gold-gradient-bg text-black" : "bg-white/5 text-[#D4AF37]"
                      }`}>
                        {meta.icon}
                      </div>
                      <h3 className={`text-xl font-black ${isVIP ? "text-[#D4AF37]" : "text-white"}`}>
                        {program.name}
                      </h3>
                    </div>

                    <p className="text-white/40 text-sm mb-6 leading-relaxed">{meta.description}</p>

                    {/* Price */}
                    {program.promo_active && program.promo_price ? (
                      <div className="mb-2">
                        <div className="inline-flex items-center gap-2 mb-2">
                          <span className="text-white/30 line-through text-lg">${program.original_price}</span>
                          <span className="bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-bold px-2 py-0.5 rounded-full">
                            SAVE {program.save_percentage}%
                          </span>
                        </div>
                        <div className="flex items-end gap-1.5">
                          <span className={`text-6xl font-black leading-none ${isVIP ? "text-[#D4AF37]" : "text-white"}`}>
                            ${program.promo_price}
                          </span>
                          <span className="text-white/40 text-sm mb-1.5">/month</span>
                        </div>
                        {program.promo_end_date && (
                          <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5">
                            <p className="text-xs text-white/30 mb-1 uppercase tracking-wider">Offer ends in</p>
                            <div className="text-[#D4AF37] font-bold text-sm">
                              <PromoCountdown endDate={program.promo_end_date} />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-end gap-1.5 mb-2">
                        <span className={`text-6xl font-black leading-none ${isVIP ? "text-[#D4AF37]" : "text-white"}`}>
                          ${program.original_price}
                        </span>
                        <span className="text-white/40 text-sm mb-1.5">/month</span>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="divider-gold my-6" />

                    {/* Features */}
                    <ul className="space-y-3 flex-1">
                      {(featuresMap[program.name] || []).map((feat) => (
                        <li key={feat} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isVIP ? "bg-[#D4AF37]/20" : "bg-[#D4AF37]/10"
                          }`}>
                            <Check size={11} className="text-[#D4AF37]" />
                          </div>
                          <span className="text-white/70 text-sm leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      onClick={() => handleApply(program.name)}
                      className={`mt-8 w-full py-4 rounded-full font-bold text-sm transition-all duration-200 ${
                        isVIP || isFeatured
                          ? "btn-gold"
                          : "border border-white/10 text-white hover:border-[#D4AF37]/30 hover:bg-white/3"
                      }`}
                    >
                      {isVIP ? "Get VIP Access" : "Apply Now"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bottom trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-white/25 text-sm mt-10"
        >
          No long-term contracts. Cancel anytime. Every plan is reviewed personally by Coach Neo.
        </motion.p>
      </div>
    </section>
  );
}
