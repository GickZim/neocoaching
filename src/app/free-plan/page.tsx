"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const categories = [
  {
    slug: "lose_weight",
    title: "Lose Weight",
    blurb: "A fat-loss focused plan to kickstart your cut.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
        <path
          d="M8 26L16 18L22 24L32 12"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 12H32V20"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    slug: "gain_weight",
    title: "Gain Weight",
    blurb: "Build size and strength with a structured bulk plan.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
        <path
          d="M8 14L16 22L22 16L32 28"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 28H32V20"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    slug: "flat_tummy",
    title: "Flat Tummy",
    blurb: "Core-focused training to tighten and tone your midsection.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
        <circle cx="20" cy="20" r="12" stroke="#D4AF37" strokeWidth="2" />
        <circle cx="20" cy="20" r="5" stroke="#D4AF37" strokeWidth="2" />
      </svg>
    ),
  },
] as const;

type CategorySlug = (typeof categories)[number]["slug"];

const signupSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  consent: z.boolean().refine((v) => v === true, {
    message: "You must agree to receive messages to continue",
  }),
});

type SignupForm = z.infer<typeof signupSchema>;

function TicketCard({
  cat,
  onSelect,
}: {
  cat: (typeof categories)[number];
  onSelect: (slug: CategorySlug) => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="relative rounded-2xl overflow-hidden border border-zinc-800 hover:border-[#D4AF37]/60 transition-colors"
      style={{
        background:
          "radial-gradient(circle at 1px 1px, rgba(212,175,55,0.04) 1px, transparent 0) 0 0/16px 16px, #141414",
      }}
    >
      {/* Top: icon + goal */}
      <div className="p-6 pb-8">
        <div className="mb-4">{cat.icon}</div>
        <h2 className="font-[Bebas_Neue] text-2xl tracking-wide text-[#F5F1E8] mb-2">
          {cat.title}
        </h2>
        <p className="font-[Barlow] text-[#8A8A8A] text-sm leading-relaxed">
          {cat.blurb}
        </p>
      </div>

      {/* Perforation / tear line */}
      <div className="relative h-0">
        <div
          className="absolute -left-3 top-0 w-6 h-6 rounded-full -translate-y-1/2"
          style={{ background: "#0A0A0A" }}
        />
        <div
          className="absolute -right-3 top-0 w-6 h-6 rounded-full -translate-y-1/2"
          style={{ background: "#0A0A0A" }}
        />
        <div className="border-t border-dashed border-zinc-700 w-full" />
      </div>

      {/* Bottom: CTA */}
      <button
        onClick={() => onSelect(cat.slug)}
        className="w-full text-left px-6 py-5 font-[Barlow] font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors flex items-center justify-between"
      >
        Claim This Plan
        <span aria-hidden>→</span>
      </button>
    </motion.div>
  );
}

export default function FreePlanPage() {
  const [selected, setSelected] = useState<CategorySlug | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const closeModal = () => {
    setSelected(null);
    setStatus("idle");
    setDownloadUrl(null);
    reset();
  };

  const onSubmit = async (data: SignupForm) => {
    if (!selected) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/free-plan-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, category: selected }),
      });

      if (!res.ok) throw new Error("Signup failed");

      const result = await res.json();
      setDownloadUrl(result.downloadUrl);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white px-6 py-24 relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-3xl mx-auto text-center mb-16 relative">
        <span className="font-[Barlow] text-[#D4AF37] text-xs tracking-[0.3em] uppercase">
          Free Access · No Card Required
        </span>
        <h1 className="font-[Bebas_Neue] text-5xl md:text-7xl tracking-wide text-[#F5F1E8] mt-4">
          Choose Your Path
        </h1>
        <p className="font-[Barlow] text-[#8A8A8A] mt-4 text-lg">
          Every plan is built by a real coach — not a template. Pick the goal
          that matches yours.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
        {categories.map((cat) => (
          <TicketCard key={cat.slug} cat={cat} onSelect={setSelected} />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#141414] border border-[#D4AF37]/30 rounded-2xl p-8 max-w-md w-full relative"
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-[#8A8A8A] hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>

              {status === "success" && downloadUrl ? (
                <div className="text-center">
                  <h3 className="font-[Bebas_Neue] text-3xl text-[#D4AF37] mb-3 tracking-wide">
                    You&apos;re In
                  </h3>
                  <p className="font-[Barlow] text-[#8A8A8A] mb-6">
                    Your plan is ready. A copy is also on its way to your inbox.
                  </p>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-[#D4AF37] text-black font-[Barlow] font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Download Now
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <span className="font-[Barlow] text-[#D4AF37] text-xs tracking-[0.2em] uppercase">
                    {categories.find((c) => c.slug === selected)?.title}
                  </span>
                  <h3 className="font-[Bebas_Neue] text-3xl text-[#F5F1E8] mt-1 mb-6 tracking-wide">
                    Almost There
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <input
                        {...register("name")}
                        placeholder="Full Name"
                        className="w-full bg-[#0A0A0A] border border-zinc-700 rounded-lg px-4 py-3 font-[Barlow] text-[#F5F1E8] focus:border-[#D4AF37] outline-none transition-colors"
                      />
                      {errors.name && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        {...register("email")}
                        placeholder="Email Address"
                        className="w-full bg-[#0A0A0A] border border-zinc-700 rounded-lg px-4 py-3 font-[Barlow] text-[#F5F1E8] focus:border-[#D4AF37] outline-none transition-colors"
                      />
                      {errors.email && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <label className="flex items-start gap-2 text-sm font-[Barlow] text-[#8A8A8A]">
                      <input
                        type="checkbox"
                        {...register("consent")}
                        className="mt-1 accent-[#D4AF37]"
                      />
                      I agree to receive promotional messages from Neo Coaching.
                    </label>
                    {errors.consent && (
                      <p className="text-red-400 text-xs">
                        {errors.consent.message}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full bg-[#D4AF37] text-black font-[Barlow] font-semibold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {status === "loading" ? "Sending..." : "Get My Free Plan"}
                    </button>

                    {status === "error" && (
                      <p className="text-red-400 text-sm text-center">
                        Something went wrong. Please try again.
                      </p>
                    )}
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
