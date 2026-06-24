"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import {
  Camera,
  Save,
  Lock,
  Share2,
  Loader2,
  CheckCircle,
  XCircle,
  User,
  Target,
  Scale,
  Calendar,
  Mail,
  ChevronDown,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  goal: string | null;
  current_weight: number | null;
  target_weight: number | null;
  height_cm: number | null;
  age: number | null;
  country: string | null;
  whatsapp: string | null;
  created_at: string | null;
  avatar_url: string | null;
};

type Toast = { type: "success" | "error"; message: string } | null;

// ─── Small reusable components ────────────────────────────────────────────────

function ToastBanner({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-medium transition-all
        ${
          toast.type === "success"
            ? "bg-zinc-900 border-emerald-500/40 text-emerald-400"
            : "bg-zinc-900 border-red-500/40 text-red-400"
        }`}
    >
      {toast.type === "success" ? (
        <CheckCircle size={18} />
      ) : (
        <XCircle size={18} />
      )}
      {toast.message}
      <button onClick={onClose} className="ml-2 text-zinc-500 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
        {icon}
      </div>
      <div>
        <p className="text-zinc-500 text-xs">{label}</p>
        <p className="text-white font-semibold text-sm mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Social Share Modal ───────────────────────────────────────────────────────

function ShareModal({
  profile,
  onClose,
}: {
  profile: Profile;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Real weights fetched from checkins table
  const [startWeight, setStartWeight] = useState<number | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [loadingWeights, setLoadingWeights] = useState(true);

  // Fetch first and latest check-in weights on mount
  useEffect(() => {
    async function fetchWeights() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoadingWeights(false);
        return;
      }

      const { data } = await supabase
        .from("checkins")
        .select("weight, created_at")
        .eq("user_id", user.id)
        .not("weight", "is", null)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        setStartWeight(data[0].weight);
        setCurrentWeight(data[data.length - 1].weight);
      } else {
        // Fall back to profile values if no check-ins yet
        setStartWeight(profile.current_weight);
        setCurrentWeight(profile.current_weight);
      }
      setLoadingWeights(false);
    }
    fetchWeights();
  }, [profile.current_weight]);

  // Derived: how much lost/gained and which direction
  const diff =
    startWeight !== null && currentWeight !== null
      ? parseFloat((startWeight - currentWeight).toFixed(1))
      : null;
  const isLoss = diff !== null && diff > 0;
  const isGain = diff !== null && diff < 0;
  const diffAbs = diff !== null ? Math.abs(diff) : null;

  // ── Canvas helpers ─────────────────────────────────────────────────────────

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ── Generate card ──────────────────────────────────────────────────────────

  async function generateShareCard() {
    setGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;

    // ── Background ──
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 1080, 1080);

    // Subtle dot-grid texture
    ctx.fillStyle = "rgba(212,175,55,0.05)";
    for (let x = 40; x < 1080; x += 48) {
      for (let y = 40; y < 1080; y += 48) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Gold top bar (thick)
    ctx.fillStyle = "#D4AF37";
    ctx.fillRect(0, 0, 1080, 10);

    // Glowing arc behind the centre
    ctx.save();
    ctx.shadowColor = "rgba(212,175,55,0.22)";
    ctx.shadowBlur = 160;
    ctx.fillStyle = "rgba(212,175,55,0.07)";
    ctx.beginPath();
    ctx.arc(540, 560, 380, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── Logo ──
    await new Promise<void>((resolve) => {
      const logo = new window.Image();
      logo.crossOrigin = "anonymous";
      logo.src = "/images/logo1.png";
      logo.onload = () => {
        ctx.drawImage(logo, 56, 30, 88, 88);
        resolve();
      };
      logo.onerror = () => resolve();
    });

    ctx.textAlign = "left";
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 34px Arial, sans-serif";
    ctx.fillText("NeoCoaching", 160, 70);
    ctx.fillStyle = "rgba(212,175,55,0.55)";
    ctx.font = "19px Arial, sans-serif";
    ctx.fillText("Transform Your Physique", 162, 100);

    // Top divider
    const grad = ctx.createLinearGradient(60, 0, 1020, 0);
    grad.addColorStop(0, "rgba(212,175,55,0)");
    grad.addColorStop(0.3, "rgba(212,175,55,0.5)");
    grad.addColorStop(0.7, "rgba(212,175,55,0.5)");
    grad.addColorStop(1, "rgba(212,175,55,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(60, 138, 960, 1);

    // ── Name + title ──
    const name = profile.full_name ?? "Client";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "28px Arial, sans-serif";
    ctx.fillText("presenting", 540, 210);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 78px Arial, sans-serif";
    ctx.fillText(name, 540, 300);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 52px Arial, sans-serif";
    ctx.fillText("TRANSFORMATION JOURNEY", 540, 368);

    // ── Weight cards: START → CURRENT ──
    const cardY = 420;
    const cardH = 190;
    const cardW = 300;
    const gap = 60;
    const arrowW = 120;
    const totalRow = cardW + arrowW + cardW;
    const rowLeft = (1080 - totalRow) / 2;

    // START card
    ctx.fillStyle = "rgba(212,175,55,0.07)";
    roundRect(ctx, rowLeft, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(212,175,55,0.3)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, rowLeft, cardY, cardW, cardH, 24);
    ctx.stroke();

    ctx.fillStyle = "rgba(212,175,55,0.65)";
    ctx.font = "bold 18px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("STARTED AT", rowLeft + cardW / 2, cardY + 46);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px Arial, sans-serif";
    ctx.fillText(
      startWeight !== null ? `${startWeight}` : "--",
      rowLeft + cardW / 2,
      cardY + 132,
    );

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "22px Arial, sans-serif";
    ctx.fillText("kg", rowLeft + cardW / 2, cardY + 168);

    // Arrow in the middle
    const arrowX = rowLeft + cardW;
    const arrowMidY = cardY + cardH / 2;
    ctx.strokeStyle = "rgba(212,175,55,0.5)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(arrowX + 16, arrowMidY);
    ctx.lineTo(arrowX + arrowW - 16, arrowMidY);
    ctx.stroke();
    ctx.setLineDash([]);
    // Arrowhead
    ctx.fillStyle = "#D4AF37";
    ctx.beginPath();
    ctx.moveTo(arrowX + arrowW - 10, arrowMidY - 8);
    ctx.lineTo(arrowX + arrowW - 10, arrowMidY + 8);
    ctx.lineTo(arrowX + arrowW - 2, arrowMidY);
    ctx.closePath();
    ctx.fill();

    // CURRENT card
    const curCardX = rowLeft + cardW + arrowW;
    ctx.fillStyle = "rgba(212,175,55,0.12)";
    roundRect(ctx, curCardX, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2;
    roundRect(ctx, curCardX, cardY, cardW, cardH, 24);
    ctx.stroke();

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 18px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("NOW", curCardX + cardW / 2, cardY + 46);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px Arial, sans-serif";
    ctx.fillText(
      currentWeight !== null ? `${currentWeight}` : "--",
      curCardX + cardW / 2,
      cardY + 132,
    );

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "22px Arial, sans-serif";
    ctx.fillText("kg", curCardX + cardW / 2, cardY + 168);

    // ── Hero diff badge ──
    if (diffAbs !== null && diffAbs > 0) {
      const badgeY = cardY + cardH + 44;
      const badgeW = 560;
      const badgeH = 120;
      const badgeX = (1080 - badgeW) / 2;

      // Badge bg — green for loss, amber for gain
      const badgeColor = isLoss ? "#16a34a" : "#b45309";
      const badgeLight = isLoss
        ? "rgba(22,163,74,0.15)"
        : "rgba(180,83,9,0.15)";
      const badgeBorder = isLoss
        ? "rgba(22,163,74,0.5)"
        : "rgba(212,175,55,0.5)";

      ctx.fillStyle = badgeLight;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 28);
      ctx.fill();
      ctx.strokeStyle = badgeBorder;
      ctx.lineWidth = 2;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 28);
      ctx.stroke();

      // Emoji + text side by side
      const emoji = isLoss ? "🔥" : "📈";
      const verb = isLoss ? "LOST" : "GAINED";

      ctx.font = "52px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(emoji, badgeX + badgeW / 2 - 130, badgeY + 78);

      ctx.fillStyle = badgeColor;
      ctx.font = "bold 64px Arial, sans-serif";
      ctx.fillText(`${diffAbs} kg`, badgeX + badgeW / 2 + 40, badgeY + 78);

      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "bold 22px Arial, sans-serif";
      ctx.fillText(verb, badgeX + badgeW / 2 + 40, badgeY + 108);
    } else if (diffAbs === 0) {
      // Maintained weight
      const badgeY = cardY + cardH + 44;
      ctx.fillStyle = "rgba(212,175,55,0.12)";
      roundRect(ctx, 240, badgeY, 600, 100, 24);
      ctx.fill();
      ctx.fillStyle = "#D4AF37";
      ctx.font = "bold 36px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "⚖️  Weight maintained — consistency wins!",
        540,
        badgeY + 62,
      );
    }

    // ── Goal strip ──
    if (profile.goal) {
      const goalY = 810;
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      roundRect(ctx, 80, goalY, 920, 100, 20);
      ctx.fill();

      ctx.fillStyle = "rgba(212,175,55,0.6)";
      ctx.font = "bold 18px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("GOAL", 540, goalY + 36);

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "26px Arial, sans-serif";
      const goalText =
        profile.goal.length > 55
          ? profile.goal.slice(0, 52) + "…"
          : profile.goal;
      ctx.fillText(goalText, 540, goalY + 76);
    }

    // ── Member since ──
    const joined = profile.created_at
      ? new Date(profile.created_at).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : null;
    if (joined) {
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "22px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Member since ${joined}`, 540, 940);
    }

    // ── Bottom bar ──
    const bottomGrad = ctx.createLinearGradient(0, 970, 0, 1080);
    bottomGrad.addColorStop(0, "rgba(212,175,55,0)");
    bottomGrad.addColorStop(1, "rgba(212,175,55,0.12)");
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, 970, 1080, 110);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("neocoaching.com", 540, 1024);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.font = "18px Arial, sans-serif";
    ctx.fillText("Start your transformation today", 540, 1055);

    // Gold bottom bar
    ctx.fillStyle = "#D4AF37";
    ctx.fillRect(0, 1070, 1080, 10);

    setGenerated(true);
    setGenerating(false);
  }

  function downloadCard() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `neocoaching-${profile.full_name?.replace(/\s+/g, "-").toLowerCase() ?? "transformation"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function shareNative() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "neocoaching-transformation.png", {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My NeoCoaching Transformation",
          text: `Check out my transformation journey with NeoCoaching! 💪🔥`,
        });
      } else {
        downloadCard();
      }
    }, "image/png");
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Share Your Progress</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Live weight preview strip */}
        {!loadingWeights && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4 flex items-center justify-between">
            <div className="text-center">
              <p className="text-zinc-500 text-xs mb-0.5">Started at</p>
              <p className="text-white font-bold text-lg">
                {startWeight !== null ? `${startWeight} kg` : "—"}
              </p>
            </div>
            <div className="text-zinc-700 text-2xl">→</div>
            <div className="text-center">
              <p className="text-zinc-500 text-xs mb-0.5">Now</p>
              <p className="text-white font-bold text-lg">
                {currentWeight !== null ? `${currentWeight} kg` : "—"}
              </p>
            </div>
            <div className="text-center">
              {diffAbs !== null && diffAbs > 0 ? (
                <>
                  <p
                    className="text-xs mb-0.5"
                    style={{ color: isLoss ? "#4ade80" : "#fbbf24" }}
                  >
                    {isLoss ? "Lost 🔥" : "Gained 📈"}
                  </p>
                  <p
                    className="font-bold text-lg"
                    style={{ color: isLoss ? "#4ade80" : "#fbbf24" }}
                  >
                    {diffAbs} kg
                  </p>
                </>
              ) : (
                <>
                  <p className="text-zinc-500 text-xs mb-0.5">Change</p>
                  <p className="text-zinc-400 font-bold text-lg">—</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Canvas preview */}
        <div className="bg-zinc-900 rounded-2xl overflow-hidden mb-4 aspect-square relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: generated ? "block" : "none" }}
          />
          {!generated && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-600">
              <Share2 size={40} />
              <p className="text-sm">
                Click generate to preview your share card
              </p>
            </div>
          )}
        </div>

        <p className="text-zinc-600 text-xs mb-5">
          1080×1080 card with NeoCoaching watermark — ready for Instagram,
          WhatsApp, or any platform.
        </p>

        <div className="flex gap-3">
          {!generated ? (
            <button
              onClick={generateShareCard}
              disabled={generating || loadingWeights}
              className="flex-1 bg-[#D4AF37] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#c4a030] transition disabled:opacity-60"
            >
              {generating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Share2 size={18} />
              )}
              {generating ? "Generating..." : "Generate Card"}
            </button>
          ) : (
            <>
              <button
                onClick={() => setGenerated(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-4 rounded-xl transition"
              >
                Redo
              </button>
              <button
                onClick={downloadCard}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Download PNG
              </button>
              <button
                onClick={shareNative}
                className="flex-1 bg-[#D4AF37] text-black font-bold py-3 rounded-xl hover:bg-[#c4a030] transition"
              >
                Share Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [showShare, setShowShare] = useState(false);
  const searchParams = useSearchParams();
  // Derive initial values directly from URL params at render time —
  // avoids the "setState synchronously within an effect" warning from
  // the React Compiler (which flags useEffect solely for state init).
  const [activeSection, setActiveSection] = useState<"details" | "password">(
    () => (searchParams.get("tab") === "password" ? "password" : "details"),
  );
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(
    () => searchParams.get("welcome") === "1",
  );
  // isInviteUser: true when the client arrived via an invite link.
  // We use the welcome=1 URL param as the signal — it's set exclusively
  // by auth/callback when type=invite, so it's 100% reliable unlike
  // trying to read AMR claims from the session which vary by Supabase version.
  // Once they successfully set a password we flip this to false.
  const [isInviteUser, setIsInviteUser] = useState(
    () => searchParams.get("welcome") === "1",
  );

  // Editable fields
  const [fullName, setFullName] = useState("");
  const [goal, setGoal] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setProfile(data);
      setFullName(data.full_name ?? "");
      setGoal(data.goal ?? "");
      setCurrentWeight(data.current_weight?.toString() ?? "");
      setTargetWeight(data.target_weight?.toString() ?? "");
      setHeightCm(data.height_cm?.toString() ?? "");
      setAge(data.age?.toString() ?? "");
      setCountry(data.country ?? "");
      setWhatsapp(data.whatsapp ?? "");
      setLoading(false);
    }
    load();
  }, []);

  // ── Avatar pick ─────────────────────────────────────────────────────────────
  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  // ── Avatar upload ───────────────────────────────────────────────────────────
  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile || !profile) return null;
    setUploadingAvatar(true);

    const ext = avatarFile.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

    setUploadingAvatar(false);
    if (error) {
      showToast("error", "Failed to upload photo");
      return null;
    }

    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  // ── Save profile details ────────────────────────────────────────────────────
  async function handleSaveDetails() {
    if (!profile) return;
    setSaving(true);

    // 1. Upload avatar first if a new file was picked
    let avatarUrl = profile.avatar_url ?? null;
    if (avatarFile) {
      const url = await uploadAvatar();
      if (url) avatarUrl = url;
    }

    // 2. Build the update payload — omit avatar_url if the column doesn't exist
    //    yet (it won't throw; Supabase just ignores unknown columns in .update()).
    //    Once you add the column via SQL below this will start persisting.
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        goal: goal.trim() || null,
        current_weight: currentWeight ? Number(currentWeight) : null,
        target_weight: targetWeight ? Number(targetWeight) : null,
        height_cm: heightCm ? Number(heightCm) : null,
        age: age ? Number(age) : null,
        country: country.trim() || null,
        whatsapp: whatsapp.trim() || null,
        ...(avatarUrl !== null ? { avatar_url: avatarUrl } : {}),
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      showToast("error", "Failed to save changes");
    } else {
      // Update local state so the avatar shows immediately without a reload
      setProfile((prev) =>
        prev
          ? { ...prev, full_name: fullName, goal, avatar_url: avatarUrl }
          : prev,
      );
      setAvatarFile(null);
      // Clear the blob preview URL to free memory — the saved URL will now render
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
      showToast("success", "Profile updated successfully");
    }
  }

  // ── Change password ─────────────────────────────────────────────────────────
  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      showToast("error", "New passwords don&apos;t match");
      return;
    }
    if (newPassword.length < 8) {
      showToast("error", "Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);

    // Invite-flow users (arrived via "You've been invited" link) never set a
    // password, so we can't re-authenticate them — skip straight to updateUser.
    if (!isInviteUser) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        setChangingPassword(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setChangingPassword(false);
        showToast("error", "Current password is incorrect");
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (error) {
      showToast("error", error.message);
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Once they've set a password, they are no longer an invite-only user
      setIsInviteUser(false);
      showToast(
        "success",
        "Password set successfully — you can now use it to log in",
      );
    }
  }

  // ── Derived display values ──────────────────────────────────────────────────
  const weightGap =
    profile?.current_weight && profile?.target_weight
      ? Math.abs(profile.current_weight - profile.target_weight).toFixed(1)
      : null;

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const avatarSrc = avatarPreview ?? profile?.avatar_url ?? null;

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4AF37]" size={36} />
      </div>
    );
  }

  return (
    <div className="pt-6 pb-16 max-w-3xl">
      <ToastBanner toast={toast} onClose={() => setToast(null)} />
      {showShare && profile && (
        <ShareModal profile={profile} onClose={() => setShowShare(false)} />
      )}

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage your account and share your journey
          </p>
        </div>
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-2 bg-[#D4AF37] text-black font-bold px-4 py-2.5 rounded-xl hover:bg-[#c4a030] transition text-sm"
        >
          <Share2 size={16} />
          Share Progress
        </button>
      </div>

      {/* ── Welcome banner (shown once after invite link) ── */}
      {showWelcomeBanner && (
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-5 mb-6 flex items-start gap-4">
          <span className="text-2xl mt-0.5">🎉</span>
          <div className="flex-1">
            <p className="font-bold text-[#D4AF37]">Welcome to NeoCoaching!</p>
            <p className="text-zinc-400 text-sm mt-1">
              Your account is ready. Set a password below so you can log in
              easily next time — then fill in your profile details.
            </p>
          </div>
          <button
            onClick={() => setShowWelcomeBanner(false)}
            className="text-zinc-600 hover:text-white mt-0.5"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Avatar + name card ── */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6 flex items-center gap-6 overflow-hidden">
        {/* Avatar — fixed 80×80, inline styles override any Tailwind/browser expansion */}
        <div className="relative flex-shrink-0">
          <div
            className="rounded-full overflow-hidden bg-zinc-800 border-2 border-[#D4AF37]/40"
            style={{ width: 80, height: 80, minWidth: 80, minHeight: 80 }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Profile"
                style={{
                  width: 80,
                  height: 80,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[#D4AF37]">
                {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center hover:bg-[#c4a030] transition"
          >
            {uploadingAvatar ? (
              <Loader2 size={14} className="animate-spin text-black" />
            ) : (
              <Camera size={14} className="text-black" />
            )}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarPick}
          />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">
            {profile?.full_name ?? "—"}
          </h2>
          <p className="text-zinc-500 text-sm mt-0.5">{profile?.email}</p>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold px-3 py-1 rounded-full border border-[#D4AF37]/20">
              Active Client
            </span>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-3 py-1 rounded-full">
              Joined {joinedDate}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Scale size={18} />}
          label="Current weight"
          value={profile?.current_weight ? `${profile.current_weight} kg` : "—"}
        />
        <StatCard
          icon={<Target size={18} />}
          label="Target weight"
          value={profile?.target_weight ? `${profile.target_weight} kg` : "—"}
        />
        <StatCard
          icon={<ChevronDown size={18} />}
          label="Gap to goal"
          value={weightGap ? `${weightGap} kg` : "—"}
        />
        <StatCard
          icon={<Calendar size={18} />}
          label="Member since"
          value={
            profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
        />
      </div>

      {/* ── Section tabs ── */}
      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 mb-6">
        {(["details", "password"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition capitalize ${
              activeSection === s
                ? "bg-[#D4AF37] text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {s === "details" ? "Personal Details" : "Change Password"}
          </button>
        ))}
      </div>

      {/* ── Details section ── */}
      {activeSection === "details" && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <User size={12} /> Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] transition"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Mail size={12} /> Email
            </label>
            <input
              type="email"
              value={profile?.email ?? ""}
              readOnly
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed"
            />
            <p className="text-zinc-600 text-xs mt-1">
              Email cannot be changed here. Contact your coach.
            </p>
          </div>

          {/* Goal */}
          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Target size={12} /> Fitness Goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Lose 10kg and build lean muscle"
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] transition resize-none"
            />
          </div>

          {/* Weights */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Scale size={12} /> Current Weight (kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder="e.g. 85"
                min={20}
                max={300}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] transition"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Target size={12} /> Target Weight (kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="e.g. 72"
                min={20}
                max={300}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] transition"
              />
            </div>
          </div>

          {/* Height + Age */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
                Height (cm)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="e.g. 175"
                min={100}
                max={250}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] transition"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
                Age
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                min={13}
                max={100}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] transition"
              />
            </div>
          </div>

          {/* Country + WhatsApp */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. South Africa"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] transition"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+27 82 000 0000"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] transition"
              />
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSaveDetails}
            disabled={saving}
            className="w-full bg-[#D4AF37] text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#c4a030] transition disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* ── Password section ── */}
      {activeSection === "password" && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Lock size={18} />
            </div>
            <div>
              <p className="font-semibold">
                {isInviteUser ? "Set Your Password" : "Change Password"}
              </p>
              <p className="text-zinc-500 text-sm">
                Must be at least 8 characters
              </p>
            </div>
          </div>

          {/* Banner for invite-flow users */}
          {isInviteUser && (
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-[#D4AF37] text-lg mt-0.5">ℹ️</span>
              <div>
                <p className="text-[#D4AF37] font-semibold text-sm">
                  You joined via an invite link
                </p>
                <p className="text-zinc-400 text-xs mt-1">
                  You don&apos;t have a current password yet. Set one below so
                  you can log in directly with your email next time.
                </p>
              </div>
            </div>
          )}

          {/* Current password — hidden for invite users */}
          {!isInviteUser && (
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] transition"
              />
            </div>
          )}

          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
              {isInviteUser ? "New Password" : "New Password"}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] transition"
            />
          </div>

          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] transition"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <XCircle size={12} /> Passwords don&apos;t match
              </p>
            )}
            {confirmPassword &&
              newPassword === confirmPassword &&
              confirmPassword.length >= 8 && (
                <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle size={12} /> Passwords match
                </p>
              )}
          </div>

          <button
            onClick={handleChangePassword}
            disabled={
              changingPassword ||
              (!isInviteUser && !currentPassword) ||
              !newPassword ||
              !confirmPassword
            }
            className="w-full bg-[#D4AF37] text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#c4a030] transition disabled:opacity-60"
          >
            {changingPassword ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Lock size={18} />
            )}
            {changingPassword
              ? "Saving..."
              : isInviteUser
                ? "Set Password"
                : "Change Password"}
          </button>
        </div>
      )}
    </div>
  );
}
