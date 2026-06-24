"use client";

import { motion } from "framer-motion";

export default function NeoMethodSection() {
  const methods = [
    {
      title: "Nutrition",
      letter: "N",
      description:
        "Custom nutrition plans built around your lifestyle and goals.",
    },
    {
      title: "Execution",
      letter: "E",
      description: "Structured workouts designed for maximum progress.",
    },
    {
      title: "Optimization",
      letter: "O",
      description: "Weekly check-ins and adjustments to keep you progressing.",
    },
  ];

  return (
    <section id="neomethod" className="bg-black text-white py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[#D4AF37] uppercase tracking-[0.3em] mb-4">
            The Neo Method
          </p>

          <h2 className="text-5xl font-bold">A Proven System For Results</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {methods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                delay: index * 0.2,
              }}
              whileHover={{
                y: -10,
                scale: 1.02,
              }}
              className="border border-[#D4AF37]/20 rounded-3xl p-8 bg-gradient-to-b from-zinc-950 to-black hover:border-[#D4AF37] hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] transition-all duration-300"
            >
              <div className="text-6xl font-bold text-[#D4AF37] mb-6">
                {method.letter}
              </div>

              <h3 className="text-2xl font-bold mb-4">{method.title}</h3>

              <p className="text-zinc-400">{method.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
