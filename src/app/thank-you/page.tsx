import Link from "next/link";

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Application
          <span className="text-[#D4AF37]"> Received</span>
        </h1>

        <p className="text-zinc-400 text-lg mb-8">
          Thank you for applying to NeoCoaching. Your application has been
          received and will be reviewed personally.
        </p>

        <p className="text-zinc-500 mb-10">
          Expect a response within 24 hours via WhatsApp or Email.
        </p>

        <Link
          href="/"
          className="bg-[#D4AF37] text-black px-8 py-4 rounded-full font-bold"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
