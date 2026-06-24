"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const transformations = [
  {
    name: "Client One",
    result: "Lost 3kg in 3 Weeks",
    before: "/transformations/before1.jpeg",
    after: "/transformations/after1.jpeg",
  },
  {
    name: "Client Two",
    result: "Built Lean Muscle in 20 Weeks",
    before: "/transformations/before2.jpeg",
    after: "/transformations/neo.jpeg",
  },
];

export default function TransformationsSection() {
  return (
    <section id="transformations" className="bg-black text-white py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-[#D4AF37] uppercase tracking-[0.3em] mb-4">
            Client Results
          </p>

          <h2 className="text-5xl font-bold">
            Real Transformations.
            <span className="text-[#D4AF37]"> Real Results.</span>
          </h2>
        </motion.div>

        <div className="space-y-10 max-w-5xl mx-auto">
          {transformations.map((client, index) => (
            <motion.div
              key={client.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                delay: index * 0.15,
              }}
              whileHover={{
                y: -5,
              }}
              className="bg-zinc-950 border border-[#D4AF37]/20 rounded-3xl p-4 md:p-6 hover:border-[#D4AF37] hover:shadow-[0_0_40px_rgba(212,175,55,0.12)] transition-all duration-300"
            >
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {/* BEFORE */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative"
                >
                  <div className="absolute top-2 left-2 z-10 bg-black/80 text-white px-3 py-1 rounded-full text-xs md:text-sm font-semibold">
                    BEFORE
                  </div>

                  <Image
                    src={client.before}
                    alt="Before"
                    width={600}
                    height={800}
                    className="rounded-2xl w-full h-[180px] md:h-[320px] object-cover"
                  />
                </motion.div>

                {/* AFTER */}
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative"
                >
                  <div className="absolute top-2 left-2 z-10 bg-[#D4AF37] text-black px-3 py-1 rounded-full text-xs md:text-sm font-bold">
                    AFTER
                  </div>

                  <Image
                    src={client.after}
                    alt="After"
                    width={600}
                    height={800}
                    className="rounded-2xl w-full h-[180px] md:h-[320px] object-cover"
                  />
                </motion.div>
              </div>

              <div className="text-center mt-6">
                <h3 className="text-2xl md:text-4xl font-bold mb-3">
                  {client.result}
                </h3>

                <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto">
                  Personalized training, nutrition guidance and accountability
                  systems designed to deliver sustainable results.
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-center mt-10">
          <Link
            href="/transformations"
            className="bg-[#D4AF37] text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition duration-300"
          >
            View All Transformations
          </Link>
        </div>
      </div>
    </section>
  );
}
