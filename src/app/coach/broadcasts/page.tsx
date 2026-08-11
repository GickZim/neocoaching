"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Loader2, Users } from "lucide-react";

const leadCategories = [
  { value: "all", label: "All Leads" },
  { value: "lose_weight", label: "Lose Weight" },
  { value: "gain_weight", label: "Gain Weight" },
  { value: "flat_tummy", label: "Flat Tummy" },
];

type Audience = "leads" | "clients" | "everyone";

export default function BroadcastsPage() {
  const [audience, setAudience] = useState<Audience>("leads");
  const [category, setCategory] = useState("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [counts, setCounts] = useState<{
    leads: Record<string, number>;
    clients: number;
    everyone: number;
  }>({
    leads: {},
    clients: 0,
    everyone: 0,
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCounts() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/coach/broadcast-counts", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.ok) setCounts(await res.json());
    }
    loadCounts();
  }, []);

  function recipientCount() {
    if (audience === "clients") return counts.clients;
    if (audience === "everyone") return counts.everyone;
    return counts.leads[category] ?? 0;
  }

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required.");
      return;
    }
    const count = recipientCount();
    if (count === 0) {
      setError("No one matches this audience.");
      return;
    }
    if (!confirm(`Send this to ${count} recipient(s)? This can't be undone.`))
      return;

    setSending(true);
    setError(null);
    setResult(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/coach/broadcast-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ audience, category, subject, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");

      setResult({ sent: data.sent, failed: data.failed });
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black mb-1">Broadcasts</h1>
      <p className="text-white/40 text-sm mb-8">
        Send a message to your clients, free-plan leads, or both.
      </p>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-semibold text-white/60 mb-2 block">
            Audience Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                value: "leads",
                label: "Free Leads",
                count: counts.leads.all ?? 0,
              },
              { value: "clients", label: "Clients", count: counts.clients },
              { value: "everyone", label: "Everyone", count: counts.everyone },
            ].map((a) => (
              <button
                key={a.value}
                onClick={() => setAudience(a.value as Audience)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition ${
                  audience === a.value
                    ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]"
                    : "border-white/10 text-white/50 hover:border-white/20"
                }`}
              >
                {a.label}
                <span className="flex items-center gap-1 text-xs opacity-70">
                  <Users size={12} />
                  {a.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {audience === "leads" && (
          <div>
            <label className="text-sm font-semibold text-white/60 mb-2 block">
              Goal Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {leadCategories.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition ${
                    category === c.value
                      ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]"
                      : "border-white/10 text-white/50 hover:border-white/20"
                  }`}
                >
                  {c.label}
                  <span className="flex items-center gap-1 text-xs opacity-70">
                    <Users size={12} />
                    {counts.leads[c.value] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-semibold text-white/60 mb-2 block">
            Subject
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. New coaching slots just opened"
            className="field-premium w-full py-3 px-4 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-white/60 mb-2 block">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            placeholder="Write your message..."
            className="field-premium w-full py-3 px-4 text-sm resize-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {result && (
          <p className="text-green-400 text-sm">
            Sent to {result.sent} recipient(s).{" "}
            {result.failed > 0 && `${result.failed} failed.`}
          </p>
        )}

        <button
          onClick={handleSend}
          disabled={sending}
          className="flex items-center gap-2 gold-gradient-bg text-black font-bold px-6 py-3 rounded-xl disabled:opacity-50"
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {sending ? "Sending..." : `Send to ${recipientCount()} Recipient(s)`}
        </button>
      </div>
    </div>
  );
}
