"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Client = {
  id: string;
  full_name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  itemId: string;
  assignmentTable: string;
  assignmentField: string;
};

export default function AssignClientModal({
  open,
  onClose,
  itemId,
  assignmentTable,
  assignmentField,
}: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState("");

  useEffect(() => {
    if (!open) return;

    loadClients();

    async function loadClients() {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "client");

      setClients(data || []);
    }
  }, [open]);

  async function assignClient() {
    if (!selectedClient) {
      alert("Select a client");
      return;
    }

    const payload: Record<string, string> = {
      client_id: selectedClient,
    };

    payload[assignmentField] = itemId;

    const { error } = await supabase.from(assignmentTable).insert(payload);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Assigned successfully");
    onClose();
  }

  if (!open) return null;

  const filteredClients = clients.filter((client) =>
    client.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Assign Client</h2>

        <input
          type="text"
          placeholder="Search client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white mb-4"
        />

        <div className="max-h-80 overflow-y-auto space-y-2">
          {filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client.id)}
              className={`w-full text-left p-4 rounded-xl border transition ${
                selectedClient === client.id
                  ? "border-[#D4AF37] bg-[#D4AF37]/10"
                  : "border-zinc-800 bg-zinc-950"
              }`}
            >
              <p className="text-white font-medium">{client.full_name}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={assignClient}
            className="flex-1 bg-[#D4AF37] text-black py-3 rounded-xl font-bold"
          >
            Assign
          </button>

          <button
            onClick={onClose}
            className="flex-1 bg-zinc-800 text-white py-3 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
