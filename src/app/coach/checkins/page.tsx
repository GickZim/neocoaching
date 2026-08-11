"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

type Checkin = {
  id: string;
  user_id: string;
  weight: number | null;
  sleep_quality: number | null;
  energy_level: number | null;
  workout_adherence: number | null;
  stress: number | null;
  challenges: string | null;
  wins: string | null;
  questions: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function CheckinsPage() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCheckins() {
      const { data, error } = await supabase
        .from("checkins")
        .select(
          `
          id, user_id, weight, sleep_quality, energy_level,
          workout_adherence, stress, challenges, wins, questions, created_at,
          profiles ( full_name, avatar_url )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Checkins load error:", error);
      } else if (data) {
        setCheckins(data as unknown as Checkin[]);
      }
      setLoading(false);
    }
    loadCheckins();
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black mb-1">Client Check-ins</h1>
      <p className="text-white/40 text-sm mb-8">
        {checkins.length} check-in{checkins.length !== 1 && "s"} submitted
      </p>

      {checkins.length === 0 ? (
        <div className="text-center py-16 text-white/30 border border-white/5 rounded-2xl">
          No check-ins yet.
        </div>
      ) : (
        <div className="space-y-4">
          {checkins.map((checkin) => (
            <div
              key={checkin.id}
              className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 hover:border-[#D4AF37]/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full gold-gradient-bg flex items-center justify-center font-black text-black text-sm">
                    {checkin.profiles?.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {checkin.profiles?.full_name ?? "Unknown Client"}
                    </p>
                    <p className="text-xs text-white/30">
                      {formatDate(checkin.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <Metric
                  label="Weight"
                  value={checkin.weight ? `${checkin.weight} kg` : "—"}
                />
                <Metric
                  label="Sleep"
                  value={
                    checkin.sleep_quality ? `${checkin.sleep_quality}/10` : "—"
                  }
                />
                <Metric
                  label="Energy"
                  value={
                    checkin.energy_level ? `${checkin.energy_level}/10` : "—"
                  }
                />
                <Metric
                  label="Stress"
                  value={checkin.stress ? `${checkin.stress}/10` : "—"}
                />
                <Metric
                  label="Workout"
                  value={
                    checkin.workout_adherence
                      ? `${checkin.workout_adherence}%`
                      : "—"
                  }
                />
              </div>

              {(checkin.wins || checkin.challenges || checkin.questions) && (
                <div className="space-y-2 pt-3 border-t border-white/5 text-sm">
                  {checkin.wins && (
                    <p>
                      <span className="text-[#D4AF37] font-semibold">
                        Wins:{" "}
                      </span>
                      <span className="text-white/60">{checkin.wins}</span>
                    </p>
                  )}
                  {checkin.challenges && (
                    <p>
                      <span className="text-[#D4AF37] font-semibold">
                        Challenges:{" "}
                      </span>
                      <span className="text-white/60">
                        {checkin.challenges}
                      </span>
                    </p>
                  )}
                  {checkin.questions && (
                    <p>
                      <span className="text-[#D4AF37] font-semibold">
                        Questions:{" "}
                      </span>
                      <span className="text-white/60">{checkin.questions}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/30 text-xs mb-1">{label}</p>
      <p className="font-bold text-white/90">{value}</p>
    </div>
  );
}
