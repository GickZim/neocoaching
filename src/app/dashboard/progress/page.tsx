"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type UploadCardProps = {
  title: string;
  file: File | null;
  setFile: (file: File | null) => void;
};

function UploadCard({ title, file, setFile }: UploadCardProps) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
      <h3 className="font-semibold text-lg text-white mb-4">{title}</h3>

      <div className="h-72 rounded-xl border-2 border-dashed border-zinc-700 overflow-hidden flex items-center justify-center bg-black">
        {file ? (
          <img
            src={URL.createObjectURL(file)}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-zinc-500 text-sm">No image selected</span>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        className="mt-4 w-full text-sm text-zinc-400"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
    </div>
  );
}

export default function ProgressPage() {
  const [front, setFront] = useState<File | null>(null);
  const [side, setSide] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  const uploadFile = async (file: File, path: string) => {
    return await supabase.storage.from("progress-photos").upload(path, file, {
      upsert: true,
    });
  };

  const handleUpload = async () => {
    try {
      setLoading(true);

      if (!front || !side || !back) {
        alert("Please upload Front, Side and Back photos.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in.");
        return;
      }

      const week = Date.now();

      const frontPath = `${user.id}/${week}/front.jpg`;
      const sidePath = `${user.id}/${week}/side.jpg`;
      const backPath = `${user.id}/${week}/back.jpg`;

      const [frontResult, sideResult, backResult] = await Promise.all([
        uploadFile(front, frontPath),
        uploadFile(side, sidePath),
        uploadFile(back, backPath),
      ]);

      if (frontResult.error || sideResult.error || backResult.error) {
        alert("Upload failed. Please try again.");
        return;
      }

      const frontUrl = supabase.storage
        .from("progress-photos")
        .getPublicUrl(frontPath).data.publicUrl;

      const sideUrl = supabase.storage
        .from("progress-photos")
        .getPublicUrl(sidePath).data.publicUrl;

      const backUrl = supabase.storage
        .from("progress-photos")
        .getPublicUrl(backPath).data.publicUrl;

      const { error } = await supabase.from("progress_photos").insert({
        user_id: user.id,
        week_number: Math.floor(Date.now() / 1000),
        front_photo: frontUrl,
        side_photo: sideUrl,
        back_photo: backUrl,
        weight: null,
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("Weekly progress photos uploaded successfully!");

      setFront(null);
      setSide(null);
      setBack(null);
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-white">Progress Photos</h1>

        <p className="text-zinc-400 mt-2">
          Upload your weekly transformation photos and track your results over
          time.
        </p>
      </div>

      {/* Guidelines */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-8">
        <h3 className="text-[#D4AF37] font-semibold text-lg mb-4">
          Photo Guidelines
        </h3>

        <ul className="space-y-2 text-zinc-400">
          <li>• Use the same lighting every week</li>
          <li>• Wear similar clothing for consistency</li>
          <li>• Stand naturally and relaxed</li>
          <li>• Capture your full body in frame</li>
          <li>• Use the same location if possible</li>
        </ul>
      </div>

      {/* Upload Area */}
      <div className="bg-zinc-950 rounded-3xl border border-zinc-800 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <UploadCard title="Front Photo" file={front} setFile={setFront} />

          <UploadCard title="Side Photo" file={side} setFile={setSide} />

          <UploadCard title="Back Photo" file={back} setFile={setBack} />
        </div>

        <div className="mt-8">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="
              bg-[#D4AF37]
              hover:bg-[#c9a633]
              text-black
              font-bold
              px-10
              py-4
              rounded-xl
              transition-all
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {loading ? "Uploading Photos..." : "Upload Weekly Check-In"}
          </button>
        </div>
      </div>
    </div>
  );
}
