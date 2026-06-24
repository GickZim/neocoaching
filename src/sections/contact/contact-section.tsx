"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ContactSection() {
  return (
    <section id="contact" className="bg-black text-white py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[40px] border border-[#D4AF37]/20 overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.06) 0%, #000 60%)" }}
        >
          {/* Background shimmer glow */}
          <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-[#D4AF37]/5 blur-[80px] pointer-events-none" />

          <div className="relative p-10 sm:p-16 text-center">
            <p className="section-label mb-4">Start Your Transformation</p>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight mb-6">
              Ready To Become
              <span style={{
                background: "linear-gradient(135deg, #D4AF37, #F5D97A, #C9A227)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "block",
              }}>
                Your Best Self?
              </span>
            </h2>

            <p className="text-white/40 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Stop guessing. Get a proven coaching system with personalized
              training, nutrition guidance and accountability designed for real results.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Link href="/apply" className="btn-gold flex items-center justify-center gap-2 group text-base px-8 py-4">
                Apply For Coaching
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => document.getElementById("transformations")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center justify-center gap-2 border border-white/12 hover:border-[#D4AF37]/30 text-white/60 hover:text-white px-8 py-4 rounded-full font-semibold transition-all duration-200 text-base"
              >
                View Results
              </button>
            </div>

            <div className="divider-gold max-w-xs mx-auto mb-10" />

            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { value: "20+", label: "Clients Coached" },
                { value: "30+", label: "Kg Lost" },
                { value: "5+",  label: "Countries Reached" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <h3 className="text-4xl font-black" style={{
                    background: "linear-gradient(135deg, #D4AF37, #F5D97A)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>{value}</h3>
                  <p className="text-white/30 text-sm mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
