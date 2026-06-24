"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import {
  Loader2,
  Camera,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProgressPhoto = {
  id: string;
  week_number: number;
  front_photo: string;
  side_photo: string;
  back_photo: string;
  created_at: string;
};

type View = "front" | "side" | "back";

// ─── Comparison Slider ────────────────────────────────────────────────────────

function ComparisonSlider({
  beforeSrc,
  afterSrc,
  beforeLabel,
  afterLabel,
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel: string;
  afterLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50); // percent
  const [dragging, setDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(400); // tracked in state, never read from ref during render

  // Keep containerWidth in sync with actual element size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.offsetWidth);
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function getPercent(clientX: number): number {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 50;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * 100;
  }

  // Mouse
  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
    setPosition(getPercent(e.clientX));
  }
  useEffect(() => {
    if (!dragging) return;
    function onMove(e: MouseEvent) {
      setPosition(getPercent(e.clientX));
    }
    function onUp() {
      setDragging(false);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  // Touch
  function onTouchStart(e: React.TouchEvent) {
    setPosition(getPercent(e.touches[0].clientX));
  }
  function onTouchMove(e: React.TouchEvent) {
    setPosition(getPercent(e.touches[0].clientX));
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl select-none cursor-col-resize"
      style={{ aspectRatio: "3/4" }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      {/* AFTER (full width, bottom layer) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterSrc}
        alt="After"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* BEFORE (clipped to left side) — needs raw <img> so we can set a dynamic
          pixel width matching the container; next/image wraps in a span that breaks
          the overflow-hidden clip trick the slider relies on. */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeSrc}
          alt="Before"
          className="absolute top-0 left-0 h-full object-cover"
          style={{ width: containerWidth }} // ← state value, safe to read during render
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        {/* Handle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                     w-10 h-10 rounded-full bg-white shadow-xl
                     flex items-center justify-center"
        >
          <ArrowLeftRight size={16} className="text-black" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
          {beforeLabel}
        </span>
      </div>
      <div className="absolute top-3 right-3 pointer-events-none">
        <span className="bg-[#D4AF37]/90 text-black text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
          {afterLabel}
        </span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProgressHistoryPage() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"history" | "compare">("history");
  const [beforeIdx, setBeforeIdx] = useState(0);
  const [afterIdx, setAfterIdx] = useState(1);
  const [view, setView] = useState<View>("front");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("progress_photos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setPhotos(data);
      setLoading(false);
    }
    load();
  }, []);

  function getImageUrl(path: string) {
    if (path?.startsWith("http")) return path;
    return supabase.storage.from("progress-photos").getPublicUrl(path).data
      .publicUrl;
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function photoSrc(photo: ProgressPhoto, v: View) {
    const map = {
      front: photo.front_photo,
      side: photo.side_photo,
      back: photo.back_photo,
    };
    return getImageUrl(map[v]);
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4AF37]" size={36} />
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (photos.length === 0) {
    return (
      <div className="pt-6">
        <h1 className="text-3xl font-bold mb-8">Progress History</h1>
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-16 text-center">
          <Camera size={40} className="text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No progress photos yet</h3>
          <p className="text-zinc-500 text-sm">
            Upload your first progress photos to start tracking your
            transformation.
          </p>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="pt-6 pb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Progress History</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {photos.length} update{photos.length !== 1 ? "s" : ""} recorded
          </p>
        </div>

        {/* Mode toggle — only show Compare if ≥2 uploads */}
        {photos.length >= 2 && (
          <div className="flex gap-1 bg-zinc-900 rounded-xl p-1">
            <button
              onClick={() => setMode("history")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "history"
                  ? "bg-[#D4AF37] text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              History
            </button>
            <button
              onClick={() => setMode("compare")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "compare"
                  ? "bg-[#D4AF37] text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <ArrowLeftRight size={14} />
              Compare
            </button>
          </div>
        )}
      </div>

      {/* ── COMPARE MODE ── */}
      {mode === "compare" && photos.length >= 2 && (
        <div className="space-y-6">
          {/* View selector */}
          <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 w-fit">
            {(["front", "side", "back"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                  view === v
                    ? "bg-[#D4AF37] text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Week pickers */}
          <div className="grid grid-cols-2 gap-4">
            {/* Before picker */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-3">
                Before
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBeforeIdx((i) => Math.max(0, i - 1))}
                  disabled={beforeIdx === 0}
                  className="p-1.5 rounded-lg bg-zinc-800 disabled:opacity-30 hover:bg-zinc-700 transition"
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="flex-1 text-center">
                  <p className="font-semibold text-sm">
                    Week {photos.length - beforeIdx}
                  </p>
                  <p className="text-zinc-500 text-xs">
                    {formatDate(photos[beforeIdx].created_at)}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setBeforeIdx((i) => Math.min(photos.length - 1, i + 1))
                  }
                  disabled={beforeIdx === photos.length - 1}
                  className="p-1.5 rounded-lg bg-zinc-800 disabled:opacity-30 hover:bg-zinc-700 transition"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* After picker */}
            <div className="bg-zinc-950 border border-[#D4AF37]/30 rounded-2xl p-4">
              <p className="text-[#D4AF37] text-xs uppercase tracking-wider mb-3">
                After
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAfterIdx((i) => Math.max(0, i - 1))}
                  disabled={afterIdx === 0}
                  className="p-1.5 rounded-lg bg-zinc-800 disabled:opacity-30 hover:bg-zinc-700 transition"
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="flex-1 text-center">
                  <p className="font-semibold text-sm">
                    Week {photos.length - afterIdx}
                  </p>
                  <p className="text-zinc-500 text-xs">
                    {formatDate(photos[afterIdx].created_at)}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setAfterIdx((i) => Math.min(photos.length - 1, i + 1))
                  }
                  disabled={afterIdx === photos.length - 1}
                  className="p-1.5 rounded-lg bg-zinc-800 disabled:opacity-30 hover:bg-zinc-700 transition"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Warn if same week selected */}
          {beforeIdx === afterIdx ? (
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center text-zinc-500 text-sm">
              Select two different weeks to compare
            </div>
          ) : (
            <div className="max-w-sm mx-auto">
              <ComparisonSlider
                beforeSrc={photoSrc(photos[beforeIdx], view)}
                afterSrc={photoSrc(photos[afterIdx], view)}
                beforeLabel={`Week ${photos.length - beforeIdx}`}
                afterLabel={`Week ${photos.length - afterIdx}`}
              />
              <p className="text-zinc-600 text-xs text-center mt-3">
                Drag the slider to compare
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY MODE ── */}
      {mode === "history" && (
        <div className="space-y-10">
          {photos.map((week, index) => (
            <div
              key={week.id}
              className="bg-gradient-to-b from-zinc-950 to-black border border-zinc-800 rounded-3xl p-8 shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-bold">
                    Week {photos.length - index}
                  </h2>
                  <p className="text-zinc-500 mt-1">
                    {formatDate(week.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Quick compare button — sets afterIdx to this week, beforeIdx to last */}
                  {photos.length >= 2 && index < photos.length - 1 && (
                    <button
                      onClick={() => {
                        setBeforeIdx(photos.length - 1); // oldest
                        setAfterIdx(index); // this week
                        setMode("compare");
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition text-zinc-300"
                    >
                      <ArrowLeftRight size={12} />
                      Compare to Week 1
                    </button>
                  )}
                  <span className="px-4 py-2 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm">
                    Progress Update
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Image
                  src={getImageUrl(week.front_photo)}
                  alt="Front"
                  width={600}
                  height={800}
                  className="w-full h-[420px] rounded-2xl object-cover border border-zinc-800"
                />
                <Image
                  src={getImageUrl(week.side_photo)}
                  alt="Side"
                  width={600}
                  height={800}
                  className="w-full h-[420px] rounded-2xl object-cover border border-zinc-800"
                />
                <Image
                  src={getImageUrl(week.back_photo)}
                  alt="Back"
                  width={600}
                  height={800}
                  className="w-full h-[420px] rounded-2xl object-cover border border-zinc-800"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
