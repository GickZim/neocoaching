"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [goal, setGoal] = useState("");
  const [current_weight, setCurrentWeight] = useState(0);
  const [target_weight, setTargetWeight] = useState(0);
  const [age, setAge] = useState(0);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          country,
          whatsapp,
          goal,
          current_weight,
          target_weight,
          age,
          role: "client",
        },
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: name,
        email,
        country,
        whatsapp,
        goal,
        current_weight,
        target_weight,
        age,
        role: "client",
      });

      if (profileError) {
        console.error(profileError);
        alert("Profile creation failed");
        return;
      }
    }

    alert("Account created successfully!");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-black overflow-y-auto py-20 px-4">
      <div className="flex justify-center">
        <div className="w-full max-w-lg bg-zinc-950 border border-yellow-700 rounded-3xl p-8">
          <h1 className="text-4xl font-bold text-white text-center">
            Client Signup
          </h1>

          <p className="text-gray-400 text-center mt-2 mb-6">
            Start your transformation journey today.
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              className="w-full p-4 rounded-xl bg-[#11131f] text-white outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Email"
              className="w-full p-4 rounded-xl bg-[#11131f] text-white outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Country"
              className="w-full p-4 rounded-xl bg-[#11131f] text-white outline-none"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />

            <input
              type="text"
              placeholder="WhatsApp Number"
              className="w-full p-4 rounded-xl bg-[#11131f] text-white outline-none"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />

            <input
              type="text"
              placeholder="Goal (e.g. Lose Weight, Build Muscle)"
              className="w-full p-4 rounded-xl bg-[#11131f] text-white outline-none"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />

            <input
              type="text"
              placeholder="Current Weight (kg)"
              className="w-full p-4 rounded-xl bg-[#11131f] text-white outline-none"
              value={current_weight}
              onChange={(e) =>
                setCurrentWeight(parseFloat(e.target.value) || 0)
              }
            />

            <input
              type="text"
              placeholder="Target Weight (kg)"
              className="w-full p-4 rounded-xl bg-[#11131f] text-white outline-none"
              value={target_weight}
              onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
            />

            <input
              type="text"
              placeholder="Age"
              className="w-full p-4 rounded-xl bg-[#11131f] text-white outline-none"
              value={age}
              onChange={(e) => setAge(parseFloat(e.target.value) || 0)}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full p-4 rounded-xl bg-[#11131f] text-white outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-4 rounded-xl bg-[#11131f] text-white outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-4 rounded-xl transition"
            >
              Create Account
            </button>
          </form>

          <p className="text-gray-400 text-center mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-yellow-500">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
