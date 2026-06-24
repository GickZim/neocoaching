export default function TransformationsSection() {
  const transformations = [
    {
      name: "Sarah",
      result: "82kg → 67kg",
      duration: "12 Weeks",
      quote: "Lost weight and gained confidence.",
    },
    {
      name: "John",
      result: "95kg → 82kg",
      duration: "16 Weeks",
      quote: "The structure changed everything.",
    },
    {
      name: "Mike",
      result: "Skinny → Athletic",
      duration: "20 Weeks",
      quote: "Built muscle and consistency.",
    },
  ];

  return (
    <section id="results" className="py-24 px-6 bg-black scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#D4AF37] uppercase tracking-[0.3em] mb-4">
            Client Results
          </p>

          <h2 className="text-4xl md:text-6xl font-bold text-white">
            Real People.
            <span className="text-[#D4AF37]"> Real Results.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {transformations.map((client) => (
            <div
              key={client.name}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden"
            >
              {/* Before / After Placeholder */}
              <div className="h-72 bg-zinc-900 flex items-center justify-center">
                <span className="text-zinc-500">Before / After Photo</span>
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {client.name}
                </h3>

                <p className="text-[#D4AF37] font-semibold mb-2">
                  {client.result}
                </p>

                <p className="text-zinc-400 mb-4">{client.duration}</p>

                <p className="text-zinc-300 italic">
                  &quot;{client.quote}&quot;
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
