"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Client = {
  id: string;
  full_name: string;
  email: string;
  age: number;
  current_weight: number;
  target_weight: number;
  fitness_goal: string;
  role: string;
};

export default function CoachClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
    async function fetchClients() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "client")
        .order("full_name");

      if (error) {
        console.error(error);
      } else {
        setClients(data || []);
      }

      setLoading(false);
    }
  }, []);

  async function deleteClient(clientId: string) {
    const confirmed = confirm(
      "Delete this client permanently?\n\nThis cannot be undone.",
    );

    if (!confirmed) return;

    const response = await fetch("/api/clients/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      setClients((prev) => prev.filter((client) => client.id !== clientId));

      alert("Client deleted successfully");
    } else {
      alert(data.error || "Failed to delete client");
    }
  }
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Clients</h1>

        <p className="text-gray-400 mb-8">Manage all coaching clients</p>

        {loading ? (
          <p>Loading clients...</p>
        ) : clients.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl p-8 text-center">
            No clients found
          </div>
        ) : (
          <div className="grid gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Left Side */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-1">
                      {client.full_name}
                    </h2>

                    <p className="text-gray-400 break-all mb-4">
                      {client.email}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Age</p>
                        <p>{client.age || "-"}</p>
                      </div>

                      <div>
                        <p className="text-gray-500">Current</p>
                        <p>{client.current_weight || "-"} kg</p>
                      </div>

                      <div>
                        <p className="text-gray-500">Target</p>
                        <p>{client.target_weight || "-"} kg</p>
                      </div>

                      <div>
                        <p className="text-gray-500">Goal</p>
                        <p>{client.fitness_goal || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                    <Link
                      href={`/coach/clients/${client.id}`}
                      className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-semibold text-center whitespace-nowrap"
                    >
                      View Profile
                    </Link>

                    <button
                      onClick={() => deleteClient(client.id)}
                      className="bg-red-600 px-6 py-3 rounded-xl font-semibold whitespace-nowrap"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
