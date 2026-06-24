"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Applicant = {
  id: string;
  full_name: string;
  program: string;
  country: string;
  email: string;
  whatsapp: string;
  goal: string;
  status: string;
  created_at: string;
};

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  async function fetchApplicants() {
    const { data, error } = await supabase
      .from("applicants")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setApplicants(data || []);
  }

  useEffect(() => {
    fetchApplicants();
  }, []);

  async function updateStatus(
    applicantId: string,
    status: "approved" | "rejected",
  ) {
    const { error } = await supabase
      .from("applicants")
      .update({ status })
      .eq("id", applicantId);

    if (!error) {
      setApplicants((prev) => prev.filter((a) => a.id !== applicantId));
    }
  }

  async function approveApplicant(id: string) {
    try {
      const response = await fetch("/api/applicants/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicantId: id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `Client created successfully!\n\nEmail: ${data.email}\nPassword: ${data.password}`,
        );

        fetchApplicants();
      } else {
        alert(data.error || "Failed to approve applicant");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Applicants</h1>

      {applicants.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          No pending applicants
        </div>
      ) : (
        <div className="grid gap-6">
          {applicants.map((applicant) => (
            <div
              key={applicant.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div>
                  <h2 className="text-xl font-bold">{applicant.full_name}</h2>

                  <p className="text-[#D4AF37] font-medium">
                    Program: {applicant.program}
                  </p>

                  <p className="text-zinc-300 mt-2">
                    Country: {applicant.country}
                  </p>

                  <p className="text-zinc-300">Email: {applicant.email}</p>

                  <p className="text-zinc-300">Goal: {applicant.goal}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/${applicant.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl"
                  >
                    WhatsApp
                  </a>

                  <a
                    href={`https://wa.me/${applicant.whatsapp}?text=${encodeURIComponent(
                      `Hi ${applicant.full_name} 👋

Thank you for applying to NeoCoaching and congratulations on taking the first step toward achieving your fitness goals.

I've reviewed your application and I believe we can help you achieve your goal of ${applicant.goal} through our ${applicant.program} coaching program.

To secure your spot and get started, please make your payment using the following UPI ID:

💳 UPI: 9725119320@ybl

Once payment is completed, please send me a screenshot of the payment confirmation here on WhatsApp and I'll immediately begin setting up your coaching portal and personalized plan.

Looking forward to helping you achieve your transformation! 💪

– Coach Neo`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl"
                  >
                    WhatsApp
                  </a>

                  <button
                    onClick={() => approveApplicant(applicant.id)}
                    className="px-4 py-2 bg-[#D4AF37] text-black rounded-xl font-semibold hover:opacity-90"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => updateStatus(applicant.id, "rejected")}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
