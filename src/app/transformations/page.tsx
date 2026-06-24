import Image from "next/image";

export default function TransformationsPage() {
  const transformations = [
    {
      name: "Client 1",
      result: "-3kg",
      duration: "3 Weeks",
      quote: "I finally became consistent with my nutrition.",
      image: "/transformations/noma.jpeg",
    },
    {
      name: "Client 2",
      result: "Body Recomposition",
      duration: "4 Weeks",
      quote: "The accountability changed everything.",
      image: "/transformations/damio.jpeg",
    },
    {
      name: "Client 3",
      result: "+6kg",
      duration: "5 Weeks",
      quote: "The results exceeded my expectations.",
      image: "/transformations/neo.JPG",
    },
  ];
  return (
    <main className="min-h-screen bg-black text-white pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <p className="text-[#D4AF37] uppercase tracking-[0.3em] mb-4">
            Success Stories
          </p>

          <h1 className="text-5xl md:text-7xl font-bold">
            Client
            <span className="text-[#D4AF37]"> Transformations</span>
          </h1>

          <p className="text-zinc-400 mt-6 max-w-2xl mx-auto">
            Real people. Real results. Real transformations achieved through
            personalized coaching, nutrition guidance and accountability.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {transformations.map((client) => (
            <div
              key={client.name}
              className="border border-[#D4AF37]/20 rounded-3xl overflow-hidden bg-zinc-950"
            >
              <div className="relative h-[500px]">
                <Image
                  src={client.image}
                  alt={client.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-8">
                <h3 className="text-3xl font-bold mb-2">{client.name}</h3>

                <p className="text-[#D4AF37] font-semibold mb-2">
                  {client.result}
                </p>

                <p className="text-zinc-400 mb-4">{client.duration}</p>

                <p className="italic text-zinc-300">
                  &quot;{client.quote}&quot;
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
