"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does online coaching work?",
    answer:
      "You'll receive a customized workout plan, nutrition guidance, and ongoing support through weekly check-ins and progress tracking.",
  },
  {
    question: "Do I need gym access?",
    answer:
      "No. Programs can be tailored for gym training, home workouts, or minimal equipment setups.",
  },
  {
    question: "Will I get a meal plan?",
    answer:
      "Yes. Depending on your program, you'll receive either nutrition guidance or a fully customized meal plan.",
  },
  {
    question: "How often do we check in?",
    answer:
      "Standard clients check in weekly. VIP clients receive priority support and more frequent communication.",
  },
  {
    question: "How quickly will I see results?",
    answer:
      "Most clients begin seeing noticeable progress within the first 4–8 weeks when following the plan consistently.",
  },
  {
    question: "What if I'm a beginner?",
    answer:
      "That's perfectly fine. Every plan is customized according to your current fitness level and experience.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. There are no long-term contracts. You remain in control of your coaching journey.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-black text-white py-32">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-[#D4AF37] uppercase tracking-[0.3em] mb-4">
            Frequently Asked Questions
          </p>

          <h2 className="text-5xl font-bold">Everything You Need To Know</h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
              className="border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex justify-between items-center p-6 text-left"
              >
                <span className="font-semibold text-lg">{faq.question}</span>

                <ChevronDown
                  className={`transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 pb-6 text-zinc-400">{faq.answer}</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
