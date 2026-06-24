"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

const benefits = [
  "Personalized Coaching",
  "Nutrition Guidance",
  "Weekly Accountability",
  "Sustainable Results",
];

export default function AboutSection() {
  return (
    <section id="about" className="bg-black text-white py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#D4AF37]/8 blur-[80px] rounded-full" />
            <div className="relative rounded-3xl overflow-hidden border border-[#D4AF37]/15 shadow-[0_0_60px_rgba(212,175,55,0.06)]">
              <Image
                src="/images/about/about.jpeg"
                alt="Coach Neo — NeoCoaching"
                width={700}
                height={900}
                className="w-full object-cover"
              />
              {/* Bottom scrim */}
              <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Floating stat card */}
            <div className="absolute -bottom-5 -right-4 sm:right-6 bg-[#080808]/90 backdrop-blur-xl border border-[#D4AF37]/20 rounded-2xl px-5 py-4 shadow-xl">
              <p className="text-3xl font-black text-[#D4AF37]">20+</p>
              <p className="text-white/40 text-xs font-medium mt-0.5">Lives Transformed</p>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="section-label mb-4">Meet Your Coach</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-6">
              Helping People Build
              <span style={{
                background: "linear-gradient(135deg, #D4AF37, #F5D97A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "block",
              }}>
                Stronger Bodies &amp;<br />Greater Confidence
              </span>
            </h2>

            <p className="text-white/45 leading-relaxed mb-4 text-base">
              My name is Wandile Neo and I created NeoCoaching to help people
              achieve real, sustainable fitness transformations through structured
              training, practical nutrition and consistent accountability.
            </p>

            <p className="text-white/45 leading-relaxed mb-9 text-base">
              My coaching philosophy is simple: results come from consistency,
              not extremes. Whether your goal is fat loss, muscle gain or
              improved confidence, I provide the guidance, support and systems
              needed to help you succeed.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-10">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-3 bg-white/2 border border-white/5 rounded-xl px-4 py-3">
                  <CheckCircle size={16} className="text-[#D4AF37] shrink-0" />
                  <span className="text-sm font-medium text-white/70">{b}</span>
                </div>
              ))}
            </div>

            <Link href="/apply" className="btn-gold inline-flex items-center gap-2 group text-sm">
              Start Your Transformation
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
