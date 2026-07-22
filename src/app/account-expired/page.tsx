"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Lock } from "lucide-react";

export default function AccountExpiredPage() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <Image
          src="/images/logo1.png"
          alt="NeoCoaching"
          width={72}
          height={72}
          className="mx-auto mb-6 rounded-xl"
        />
        <div className="bg-zinc-950 border border-[#D4AF37]/20 rounded-3xl p-8">
          <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-5">
            <Lock size={24} className="text-[#D4AF37]" />
          </div>
          <h1 className="text-xl font-bold mb-3">
            Your coaching period has ended
          </h1>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            The access period you signed up for has come to an end. Please reach
            out to your coach to renew or discuss next steps.
          </p>
          <a
            href="https://wa.me/+919725119320"
            className="inline-block w-full bg-[#D4AF37] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#c4a030] transition mb-3"
          >
            Message Your Coach
          </a>
          <button
            onClick={handleLogout}
            className="text-white/40 text-sm hover:text-white/70 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
