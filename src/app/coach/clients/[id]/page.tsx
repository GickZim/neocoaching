"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  country: string;
  goal: string;
  current_weight: number;
  target_weight: number;
  age: number;
  coach_notes: string;
};

type Checkin = {
  id: string;
  weight: number;
  sleep_quality: number;
  energy_level: number;
  workout_adherence: number;
  stress: number;
  wins: string;
  challenges: string;
  questions: string;
  created_at: string;
};

type ProgressPhoto = {
  week_number: number;
  front_photo: string;
  side_photo: string;
  back_photo: string;
  weight: number;
};
type TrackingDay = {
  tracking_date: string;
  workout_completed: boolean;
  meal_plan_followed: boolean;
};

export default function ClientProfilePage() {
  const params = useParams();

  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  const [workoutRate, setWorkoutRate] = useState(0);
  const [mealRate, setMealRate] = useState(0);
  const [avgWater, setAvgWater] = useState(0);
  const [streak, setStreak] = useState(0);

  const [trackingDays, setTrackingDays] = useState<TrackingDay[]>([]);

  useEffect(() => {
    if (!clientId) return;

    async function loadClient() {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", clientId)
        .single();

      const { data: checkinData } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { data: allCheckins } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", clientId)
        .order("created_at", { ascending: false });

      const { data: photoData } = await supabase
        .from("progress_photos")
        .select("*")
        .eq("user_id", clientId)
        .order("week_number", { ascending: false });

      const { data: trackingData } = await supabase
        .from("daily_tracking")
        .select("*")
        .eq("user_id", clientId)
        .order("tracking_date", { ascending: false });
      if (trackingData?.length) {
        const totalDays = trackingData.length;

        const workoutDays = trackingData.filter(
          (d) => d.workout_completed,
        ).length;

        const mealDays = trackingData.filter(
          (d) => d.meal_plan_followed,
        ).length;

        const totalWater = trackingData.reduce(
          (sum, d) => sum + (d.water_intake || 0),
          0,
        );

        setTrackingDays(trackingData || []);
        setWorkoutRate(Math.round((workoutDays / totalDays) * 100));

        setMealRate(Math.round((mealDays / totalDays) * 100));

        setAvgWater(Number((totalWater / totalDays).toFixed(1)));

        let currentStreak = 0;

        for (const day of trackingData) {
          if (day.workout_completed || day.meal_plan_followed) {
            currentStreak++;
          } else {
            break;
          }
        }

        setStreak(currentStreak);
      }

      setProfile(profileData);
      setCheckin(checkinData);
      setPhotos(photoData || []);
      setCheckins(allCheckins || []);
      setNotes(profileData?.coach_notes || "");

      setLoading(false);
    }

    loadClient();
  }, [clientId]);

  async function saveNotes() {
    const { error } = await supabase
      .from("profiles")
      .update({
        coach_notes: notes,
      })
      .eq("id", clientId);

    if (error) {
      alert("Failed to save notes");
    } else {
      alert("Notes saved");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Client not found
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">{profile.full_name}</h1>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Overview */}
          <div className="bg-zinc-900 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">Client Overview</h2>

            <div className="space-y-2">
              <p>Email: {profile.email}</p>
              <p>WhatsApp: {profile.whatsapp || "-"}</p>
              <p>Country: {profile.country || "-"}</p>
              <p>Age: {profile.age || "-"}</p>
              <p>Goal: {profile.goal || "-"}</p>
              <p>Current Weight: {profile.current_weight || "-"} kg</p>
              <p>Target Weight: {profile.target_weight || "-"} kg</p>
            </div>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Adherence Analytics</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-zinc-400">Workout Adherence</p>

                <p className="text-4xl font-bold text-[#D4AF37]">
                  {workoutRate}%
                </p>
              </div>

              <div>
                <p className="text-zinc-400">Meal Adherence</p>

                <p className="text-4xl font-bold text-[#D4AF37]">{mealRate}%</p>
              </div>

              <div>
                <p className="text-zinc-400">Avg Water</p>

                <p className="text-4xl font-bold text-[#D4AF37]">{avgWater}L</p>
              </div>

              <div>
                <p className="text-zinc-400">Current Streak</p>

                <p className="text-4xl font-bold text-[#D4AF37]">🔥 {streak}</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">
              Monthly Compliance Calendar
            </h2>

            <div className="grid grid-cols-7 gap-3">
              {trackingDays.map((day) => {
                let bg = "bg-red-600";
                let label = "Missed";

                if (day.workout_completed && day.meal_plan_followed) {
                  bg = "bg-green-600";
                  label = "Perfect";
                } else if (day.workout_completed || day.meal_plan_followed) {
                  bg = "bg-yellow-500";
                  label = "Partial";
                }

                return (
                  <div
                    key={day.tracking_date}
                    title={label}
                    className={`${bg} h-16 rounded-xl flex flex-col items-center justify-center text-white font-bold`}
                  >
                    <span>{new Date(day.tracking_date).getDate()}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-600" />
                Perfect Day
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                Partial Day
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-600" />
                Missed Day
              </div>
            </div>
          </div>

          {/* Latest Checkin */}
          <div className="bg-zinc-900 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">Latest Check-In</h2>

            {checkin ? (
              <div className="space-y-2">
                <p>Weight: {checkin.weight} kg</p>
                <p>Sleep Quality: {checkin.sleep_quality}/10</p>
                <p>Energy Level: {checkin.energy_level}/10</p>
                <p>Workout Adherence: {checkin.workout_adherence}/10</p>
                <p>Stress: {checkin.stress}/10</p>

                <div>
                  <strong>Wins</strong>
                  <p>{checkin.wins}</p>
                </div>

                <div>
                  <strong>Challenges</strong>
                  <p>{checkin.challenges}</p>
                </div>

                <div>
                  <strong>Questions</strong>
                  <p>{checkin.questions}</p>
                </div>
              </div>
            ) : (
              <p>No check-ins submitted yet.</p>
            )}
          </div>

          {/* Progress Photo History */}
          <div className="bg-zinc-900 rounded-2xl p-6 lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Progress Photo History</h2>

            {photos.length === 0 ? (
              <p>No progress photos uploaded yet.</p>
            ) : (
              <div className="space-y-10">
                {photos.map((week) => (
                  <div
                    key={week.week_number}
                    className="border-b border-zinc-800 pb-8"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">
                        Week {week.week_number}
                      </h3>

                      <span className="text-[#D4AF37]">{week.weight} kg</span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="mb-2 text-zinc-400">Front</p>

                        <img
                          src={week.front_photo}
                          alt="Front"
                          className="rounded-xl w-full"
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-zinc-400">Side</p>

                        <img
                          src={week.side_photo}
                          alt="Side"
                          className="rounded-xl w-full"
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-zinc-400">Back</p>

                        <img
                          src={week.back_photo}
                          alt="Back"
                          className="rounded-xl w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Check-In History */}
          <div className="bg-zinc-900 rounded-2xl p-6 lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Check-In History</h2>

            {checkins.length === 0 ? (
              <p>No check-ins found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left py-3">Date</th>
                      <th className="text-left py-3">Weight</th>
                      <th className="text-left py-3">Energy</th>
                      <th className="text-left py-3">Sleep</th>
                      <th className="text-left py-3">Stress</th>
                      <th className="text-left py-3">Adherence</th>
                    </tr>
                  </thead>

                  <tbody>
                    {checkins.map((item) => (
                      <tr key={item.id} className="border-b border-zinc-800">
                        <td className="py-3">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>

                        <td>{item.weight} kg</td>
                        <td>{item.energy_level}/10</td>
                        <td>{item.sleep_quality}/10</td>
                        <td>{item.stress}/10</td>
                        <td>{item.workout_adherence}/10</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Coach Notes */}
          <div className="bg-zinc-900 rounded-2xl p-6 lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Coach Notes</h2>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full bg-zinc-800 rounded-xl p-4"
              placeholder="Write notes about this client..."
            />

            <button
              onClick={saveNotes}
              className="mt-4 bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-semibold"
            >
              Save Notes
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
