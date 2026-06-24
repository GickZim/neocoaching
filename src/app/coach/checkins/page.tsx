"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CheckinsPage() {
  type Checkin = {
    id: string;
    user_id: string;
    weight: number;
    sleep_quality: number;
    energy_level: number;
    workout_adherence: number;
    created_at: string;
  };
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  useEffect(() => {
    async function loadCheckins() {
      const { data } = await supabase
        .from("checkins")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setCheckins(data);
    }
    loadCheckins();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Client Check-ins</h1>

      <div className="space-y-4">
        {checkins.map((checkin) => (
          <div key={checkin.id} className="bg-white rounded-xl p-6 shadow">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-500">Weight</p>
                <p className="font-bold">{checkin.weight} kg</p>
              </div>

              <div>
                <p className="text-gray-500">Sleep</p>
                <p className="font-bold">{checkin.sleep_quality}/10</p>
              </div>

              <div>
                <p className="text-gray-500">Energy</p>
                <p className="font-bold">{checkin.energy_level}/10</p>
              </div>

              <div>
                <p className="text-gray-500">Workout</p>
                <p className="font-bold">{checkin.workout_adherence}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
