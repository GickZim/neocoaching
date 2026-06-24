"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";

const stats = [
  { value: "20+", label: "Clients Coached" },
  { value: "30+", label: "Kg Lost" },
  { value: "5+",  label: "Countries" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-black text-white overflow-hidden flex items-center">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] rounded-full bg-[#D4AF37]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-[#D4AF37]/3 blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-28 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* ── Left: Copy ── */}
          <div className="order-2 lg:order-1">
            {/* Social proof pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-6"
            >
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} fill="#D4AF37" color="#D4AF37" />
                ))}
              </div>
              <span className="text-xs text-white/60 font-medium">
                Trusted by <span className="text-white font-semibold">20+ clients</span> across 5 countries
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <p className="section-label mb-4">Elite Online Coaching</p>
              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
                Transform Your Body.
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #D4AF37 0%, #F5D97A 45%, #C9A227 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Build Confidence.
                </span>
              </h1>
            </motion.div>

            {/* Sub-copy */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-white/55 mt-6 text-lg leading-relaxed max-w-lg"
            >
              Personalized coaching, nutrition guidance and accountability
              systems designed to help you achieve sustainable results — not just short-term fixes.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 mt-9"
            >
              <Link href="/apply" className="btn-gold flex items-center justify-center gap-2 group text-base">
                Apply Now
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <button
                onClick={() => {
                  document.getElementById("transformations")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center justify-center gap-2 border border-white/15 hover:border-[#D4AF37]/40 text-white/70 hover:text-white px-8 py-3.5 rounded-full font-semibold transition-all duration-200 text-base"
              >
                View Results
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex gap-8 mt-12 pt-8 border-t border-white/6"
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <p
                    className="text-3xl font-black"
                    style={{
                      background: "linear-gradient(135deg, #D4AF37, #F5D97A)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {s.value}
                  </p>
                  <p className="text-white/45 text-sm mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Hero image ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.1 }}
            className="order-1 lg:order-2 relative"
          >
            {/* Glow behind image */}
            <div className="absolute inset-0 bg-[#D4AF37]/10 blur-[60px] rounded-3xl" />

            {/* Gold border frame */}
            <div className="relative rounded-3xl overflow-hidden border border-[#D4AF37]/20 shadow-[0_0_80px_rgba(212,175,55,0.08)]">
              {/* Left fade for seamless blend on desktop */}
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10 hidden lg:block" />

              <Image
                src="/images/neo-hero.jpg"
                alt="Coach Neo — NeoCoaching"
                width={700}
                height={900}
                priority
                className="w-full h-[420px] sm:h-[540px] lg:h-[700px] object-cover object-top"
              />

              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/40 to-transparent" />

              {/* Floating badge */}
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl gold-gradient-bg flex items-center justify-center shrink-0">
                    <span className="text-black font-black text-sm">N</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm leading-tight">Wandile Neo</p>
                    <p className="text-white/45 text-xs">Elite Fitness Coach</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} fill="#D4AF37" color="#D4AF37" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
