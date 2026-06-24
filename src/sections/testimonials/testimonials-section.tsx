"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Noma",
    result: "Lost 3kg in 3 Weeks",
    avatar: "N",
    testimonial:
      "NeoCoaching completely changed my lifestyle. The accountability and support kept me consistent and the results speak for themselves.",
  },
  {
    name: "Tendai M.",
    result: "Built Lean Muscle",
    avatar: "T",
    testimonial:
      "The training program was easy to follow and fit my schedule perfectly. I gained muscle while staying lean — something I'd struggled with for years.",
  },
  {
    name: "Charles",
    result: "Improved Confidence",
    avatar: "C",
    testimonial:
      "More than just fitness coaching. I became more confident, disciplined and healthier overall. 100% worth the investment.",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-black text-white py-32 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#D4AF37]/3 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <p className="section-label mb-4">Client Testimonials</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
            What My Clients{" "}
            <span style={{
              background: "linear-gradient(135deg, #D4AF37, #F5D97A, #C9A227)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Say
            </span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.12 }}
              className="card-premium rounded-3xl p-8 flex flex-col"
            >
              {/* Gold quote mark */}
              <div className="text-6xl leading-none font-black mb-4" style={{
                background: "linear-gradient(135deg, #D4AF37, #F5D97A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                "
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#D4AF37" color="#D4AF37" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/60 leading-relaxed text-sm flex-1 mb-8">
                {t.testimonial}
              </p>

              {/* Client */}
              <div className="flex items-center gap-3 pt-6 border-t border-white/6">
                <div className="w-10 h-10 rounded-full gold-gradient-bg flex items-center justify-center font-black text-black text-sm shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-[#D4AF37] text-xs font-medium">{t.result}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
