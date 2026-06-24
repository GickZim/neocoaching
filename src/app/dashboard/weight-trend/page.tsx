"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Target,
  Scale,
  Loader2,
  Calendar,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckinRow = {
  id: string;
  weight: number | null;
  created_at: string;
};

type ChartPoint = {
  date: string; // display label e.g. "12 Jan"
  fullDate: string; // tooltip e.g. "12 January 2025"
  weight: number;
};

type RangeKey = "all" | "90" | "30";

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-zinc-400 text-xs mb-1">{d.fullDate}</p>
      <p className="text-white font-bold text-lg">{d.weight} kg</p>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: "green" | "red" | "gold" | null;
}) {
  const colors = {
    green: "text-emerald-400",
    red: "text-red-400",
    gold: "text-[#D4AF37]",
    null: "text-white",
  };
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-[#D4AF37]">{icon}</div>
        <p className="text-zinc-500 text-xs uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className={`text-2xl font-bold ${colors[highlight ?? "null"]}`}>
        {value}
      </p>
      {sub && <p className="text-zinc-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WeightTrendPage() {
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("all");
  const [targetWeight, setTargetWeight] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Load checkins + profile target weight in parallel
      const [{ data: checkinData }, { data: profileData }] = await Promise.all([
        supabase
          .from("checkins")
          .select("id, weight, created_at")
          .eq("user_id", user.id)
          .not("weight", "is", null)
          .order("created_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("target_weight")
          .eq("id", user.id)
          .single(),
      ]);

      setCheckins(checkinData ?? []);
      setTargetWeight(profileData?.target_weight ?? null);
      setLoading(false);
    }
    load();
  }, []);

  // ── Filter by range ──────────────────────────────────────────────────────────
  const filtered: CheckinRow[] = (() => {
    if (range === "all") return checkins;
    const days = parseInt(range);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return checkins.filter((c) => new Date(c.created_at) >= cutoff);
  })();

  // ── Build chart data ─────────────────────────────────────────────────────────
  const chartData: ChartPoint[] = filtered
    .filter((c) => c.weight !== null)
    .map((c) => ({
      date: new Date(c.created_at).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      }),
      fullDate: new Date(c.created_at).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      weight: c.weight as number,
    }));

  // ── Stats ────────────────────────────────────────────────────────────────────
  const weights = chartData.map((d) => d.weight);
  const startW = weights[0] ?? null;
  const currentW = weights[weights.length - 1] ?? null;
  const minW = weights.length ? Math.min(...weights) : null;
  const maxW = weights.length ? Math.max(...weights) : null;

  const totalChange =
    startW !== null && currentW !== null
      ? parseFloat((currentW - startW).toFixed(1))
      : null;
  const isLoss = totalChange !== null && totalChange < 0;
  const isGain = totalChange !== null && totalChange > 0;

  const toTarget =
    currentW !== null && targetWeight !== null
      ? parseFloat((currentW - targetWeight).toFixed(1))
      : null;

  // Y-axis domain with padding
  const yMin = weights.length
    ? Math.floor(Math.min(...weights, targetWeight ?? Infinity) - 2)
    : 50;
  const yMax = weights.length
    ? Math.ceil(Math.max(...weights, targetWeight ?? -Infinity) + 2)
    : 100;

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4AF37]" size={36} />
      </div>
    );
  }

  return (
    <div className="pt-6 pb-16 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Weight Trend</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Your weight journey over time from every check-in
        </p>
      </div>

      {checkins.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-16 text-center">
          <Scale size={40} className="text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No weight data yet</h3>
          <p className="text-zinc-500 text-sm">
            Submit your first weekly check-in with your current weight to start
            tracking your trend.
          </p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              icon={<Scale size={16} />}
              label="Start weight"
              value={startW !== null ? `${startW} kg` : "—"}
              sub="First check-in"
            />
            <StatCard
              icon={<Scale size={16} />}
              label="Current weight"
              value={currentW !== null ? `${currentW} kg` : "—"}
              sub="Latest check-in"
            />
            <StatCard
              icon={
                isLoss ? (
                  <TrendingDown size={16} />
                ) : isGain ? (
                  <TrendingUp size={16} />
                ) : (
                  <Minus size={16} />
                )
              }
              label="Total change"
              value={
                totalChange !== null
                  ? `${isLoss ? "" : "+"}${totalChange} kg`
                  : "—"
              }
              highlight={isLoss ? "green" : isGain ? "red" : null}
              sub={isLoss ? "lost so far 🔥" : isGain ? "gained" : "no change"}
            />
            <StatCard
              icon={<Target size={16} />}
              label="To target"
              value={
                toTarget !== null
                  ? `${Math.abs(toTarget)} kg`
                  : targetWeight
                    ? `${targetWeight} kg target`
                    : "No target set"
              }
              highlight={toTarget !== null && toTarget <= 0 ? "green" : "gold"}
              sub={
                toTarget !== null
                  ? toTarget <= 0
                    ? "Target reached! 🎉"
                    : "remaining"
                  : "Set in My Profile"
              }
            />
          </div>

          {/* Range selector */}
          <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 mb-4 w-fit">
            {(["30", "90", "all"] as RangeKey[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  range === r
                    ? "bg-[#D4AF37] text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {r === "all" ? "All time" : `${r} days`}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-lg">Weight over time</h2>
                <p className="text-zinc-500 text-sm">
                  {chartData.length} check-in
                  {chartData.length !== 1 ? "s" : ""} recorded
                </p>
              </div>
              {targetWeight && (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span
                    className="inline-block w-6 border-t-2 border-dashed"
                    style={{ borderColor: "#D4AF37" }}
                  />
                  Target: {targetWeight} kg
                </div>
              )}
            </div>

            {chartData.length < 2 ? (
              <div className="h-64 flex items-center justify-center text-zinc-600 text-sm">
                <Calendar size={20} className="mr-2" />
                Submit at least 2 check-ins to see your trend line
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[yMin, yMax]}
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}kg`}
                    width={48}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {/* Target weight reference line */}
                  {targetWeight && (
                    <ReferenceLine
                      y={targetWeight}
                      stroke="#D4AF37"
                      strokeDasharray="6 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Target ${targetWeight}kg`,
                        position: "insideTopRight",
                        fill: "#D4AF37",
                        fontSize: 11,
                      }}
                    />
                  )}

                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#D4AF37"
                    strokeWidth={2.5}
                    dot={{
                      fill: "#D4AF37",
                      stroke: "#000",
                      strokeWidth: 2,
                      r: 5,
                    }}
                    activeDot={{
                      fill: "#D4AF37",
                      stroke: "#fff",
                      strokeWidth: 2,
                      r: 7,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Min/max callout */}
          {chartData.length >= 2 && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
                <TrendingDown
                  size={18}
                  className="text-emerald-400 flex-shrink-0"
                />
                <div>
                  <p className="text-zinc-500 text-xs">Lowest recorded</p>
                  <p className="text-white font-bold">{minW} kg</p>
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
                <TrendingUp size={18} className="text-zinc-400 flex-shrink-0" />
                <div>
                  <p className="text-zinc-500 text-xs">Highest recorded</p>
                  <p className="text-white font-bold">{maxW} kg</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
