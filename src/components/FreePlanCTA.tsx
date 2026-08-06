import Link from "next/link";

export default function FreePlanCTA() {
  return (
    <section className="relative bg-[#0A0A0A] border-y border-[#D4AF37]/15 py-20 px-6 overflow-hidden">
      <div
        className="absolute -right-24 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)",
        }}
      />
      <div className="max-w-3xl mx-auto text-center relative">
        <span className="font-[Barlow] text-[#D4AF37] text-xs tracking-[0.3em] uppercase">
          No Card · No Catch
        </span>
        <h2 className="font-[Bebas_Neue] text-4xl md:text-6xl text-[#F5F1E8] tracking-wide mt-4">
          Not Ready to Commit?
        </h2>
        <p className="font-[Barlow] text-[#8A8A8A] mt-4 text-lg max-w-xl mx-auto">
          Grab a free plan built around your goal — lose weight, gain weight, or
          tighten your core. Takes 30 seconds.
        </p>
        <Link
          href="/free-plan"
          className="inline-block mt-8 bg-[#D4AF37] text-black font-[Barlow] font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Get My Free Plan
        </Link>
      </div>
    </section>
  );
}
